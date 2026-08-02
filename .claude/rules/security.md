# Security Remarks

## Always close files and connections

<details open>
<summary></summary>

When working with files and connections in Python, proper resource management is crucial, specially for production applications. So let's explore why closing these resources is important and how to do it effectively. First, here's why closing resources matters:

-   Leaks: unclosed files and connection keep consuming system resources (file handlers, memory, netowrk sockets, etc.), which can lead to exhaustion and crashes, as these resources remain allocated until the program terminates.
-   System limitations: operating systems have limits with files and connections, exceeding these limits can cause the program to crash.
-   Data Integrity: not closing files and connections can lead to data corruption, as the data might not be flushed to disk or sent over the network.
-   Performance: too many open resources can degrade the performance of the program and the system, as the OS has to manage more resources.
-   Locking issues: some resources might be locked by the program, preventing other programs from accessing them.
-   Security: leaving files and connections open can expose the system to attacks, as they can be accessed by unauthorized users.

Here are now some examples, starting with files:

```python
# BAD PRACTICE
def read_data_unsafe():
    file = open('data.txt', 'r')
    data = file.read()
    # Do something ...
    # If an exception occurs here, the file never gets closed!
    file.close()
    return data

# GOOD PRACTICE
def read_data_safe():
    with open('data.txt', 'r') as file:
        data = file.read()
        # Do something ...
        # File automatically closes when exiting the with block,
        # even if an exception occurs
    return data
```

A good way to deal with context management, is to create a custom one using the `contextlib` module:

```python
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode):
    try:
        file = open(filename, mode)
        yield file
    finally:
        file.close()

# Usage
def process_file():
    with file_manager('data.txt', 'r') as file:
        content = file.read()
    return content
```

The same can be done in other contexts, like database and other API connections.
Another tool that we mentioned previously that can be great to solve this issue is to use Decorators to manage resources:

```python
def with_file_open(func):
    def wrapper(filename, *args, **kwargs):
        with open(filename, 'r') as file:
            return func(file, *args, **kwargs)
    return wrapper

@with_file_open
def process_content(file, search_term):
    return [line for line in file if search_term in line]
```

Although we talked a lot about files with these examples, it's important to note that files should be avoided when dealing with applications in production, except for very specific cases, such as checkpoints for model training. In general, it's better to use:

-   Dedicated Logging Modules and services: export the logs to log services or Data Lakes instead of saving them to files.
-   Databases and Blob Storage: store data in databases or blob storage services, as they are more reliable and scalable. And they can be really fast if they are deployed in the same region as the application.
-   Streaming APIs: use streaming APIs for real-time data processing, as they are more efficient and scalable than files.
-   In Memory Broker Services: use in-memory broker services for message passing between services, Pub/Sub systems, and message queues.

Now some examples for databases and networks connections:

```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def db_connection(db_name):
    conn = sqlite3.connect(db_name)
    try:
        yield conn
    finally:
        conn.close()

def query_database():
    with db_connection('app.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users')
        return cursor.fetchall()

import socket
from contextlib import contextmanager

@contextmanager
def socket_connection(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect((host, port))
        yield sock
    finally:
        sock.close()

def send_data(data):
    with socket_connection('example.com', 80) as sock:
        sock.sendall(data.encode())
        return sock.recv(1024)
```

</details>

## Don't use `eval` and `exec`, as well as `os.system` and `subprocess`

<details open>
<summary></summary>

Python provides several powerful functions, some of them are too powerful, as they can execute arbitrary code and commands, which can be a security risk. Here's why these functions should be avoided and how to use them safely. First, some reasons to avoid `eval` and `exec`:

-   Code Injection: `eval` and `exec` can execute any Python code, including malicious code, which can lead to code injection attacks. This is a serious risk specially when working with LLM Agents, as they sometimes can execute code.
-   Privilege Escalation: `eval` and `exec` can access and modify variables and functions in the current scope, which can lead to privilege escalation attacks.
-   Data Exposure: `eval` and `exec` can access sensitive data in the current scope, which can lead to data exposure attacks.

Also, some reasons to avoid `os.system` and `subprocess`:

-   Shell Injection: `os.system` and `subprocess` can execute shell commands, which can be vulnerable to shell injection attacks, specially when using user input.
-   Unexpected Behavior: the way commands in `os.system` and `subprocess` are executed depends on the system, so different systems can lead to different results, which can cause unexpected behavior.
-   Resource Exhaustion: `os.system` and `subprocess` can execute external programs, which can consume system resources and lead to resource exhaustion attacks.
-   Security Vulnerabilities: `os.system` and `subprocess` can expose the system to security vulnerabilities, giving access to files and resources to attackers.

Here are some safer alternatives that apply to some use cases: starting with `ast` and others to evaluate mathematical expressions safely:

```python
UNSAFE
def calculate_unsafe(expression):
    return eval(expression)  # Dangerous!

# SAFE: Using ast.literal_eval() for safe evaluation of literals
import ast

def calculate_safe_literals(expression):
    return ast.literal_eval(expression)  # Only evaluates literals like numbers, strings

# SAFER: Using a dedicated math parser
import simpleeval

def calculate_safe(expression):
    return simpleeval.simple_eval(expression)  # Safer mathematical evaluation

# SAFEST: Using a purpose-built solution
from sympy import sympify, symbols

def calculate_safest(expression):
    x = symbols('x')
    return sympify(expression).subs(x, 10)  # Mathematical expressions only
```

For `JSON` parsing, it's recommended to use the `json` module, as it's safer and more reliable than `eval`:

```python
# UNSAFE
def parse_json_unsafe(json_string):
    return eval(json_string)  # Dangerous!

# SAFE: Using the json module
import json

def parse_json_safe(json_string):
    return json.loads(json_string)  # Proper JSON parsing
```

For Dynamic Code, use `importlib` or develop a plug-in system:

```python
# UNSAFE
def run_dynamic_code_unsafe(code):
    exec(code)  # Dangerous!

# SAFER: Using importlib for dynamic module loading
import importlib

def run_module_safely(module_name):
    module = importlib.import_module(module_name)
    return module.run()

# SAFER: Using a plugin system with predefined interfaces
class PluginManager:
    def __init__(self):
        self.plugins = {}

    def register_plugin(self, name, plugin_class):
        if hasattr(plugin_class, 'execute') and callable(plugin_class.execute):
            self.plugins[name] = plugin_class()

    def run_plugin(self, name, *args, **kwargs):
        if name in self.plugins:
            return self.plugins[name].execute(*args, **kwargs)
        raise ValueError(f"Plugin {name} not found")
```

Whenever is truly necessary to access another external software from a Python script, it's always best to develop some API interface on both sides, so the communication is done through a well-defined contract and secure interface. If this is not possible, then use only `subprocess` with caution. Try writing a safe wrapper around the external command, validating the input and output, and avoiding shell commands whenever possible. For example:

```python
# UNSAFE: Direct shell command execution
def resize_image_unsafe(input_path, output_path, width, height):
    # Vulnerable to command injection if paths contain shell metacharacters
    os.system(f"convert {input_path} -resize {width}x{height} {output_path}")

# SAFE: Wrapper for ImageMagick operations
import subprocess
import os
import re

class ImageProcessor:
    def __init__(self, convert_path="convert"):
        self.convert_path = convert_path

    def _validate_path(self, path):
        # Ensure path is safe and exists
        if not os.path.exists(path):
            raise ValueError(f"Path does not exist: {path}")
        return os.path.abspath(path)

    def _validate_dimensions(self, width, height):
        # Ensure dimensions are positive integers
        if not (isinstance(width, int) and isinstance(height, int)):
            raise TypeError("Dimensions must be integers")
        if width <= 0 or height <= 0:
            raise ValueError("Dimensions must be positive")
        return width, height

    def resize_image(self, input_path, output_path, width, height):
        # Validate all inputs
        input_path = self._validate_path(input_path)
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        width, height = self._validate_dimensions(width, height)

        # Use subprocess with arguments as list (no shell=True)
        try:
            result = subprocess.run(
                [self.convert_path, input_path, "-resize", f"{width}x{height}", output_path],
                capture_output=True,
                text=True,
                check=True
            )
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Image processing failed: {e.stderr}")

# Usage
processor = ImageProcessor()
try:
    processor.resize_image("input.jpg", "output.jpg", 800, 600)
except (ValueError, TypeError, RuntimeError) as e:
    print(f"Error: {e}")
```

But only do that if you're absolutely sure that there's no other way to achieve the same result. In general, it's better to avoid executing external commands from Python scripts, as it can lead to security vulnerabilities and unexpected behavior.

</details>

## Don't use `pickle` for serialization, `random` for cryptography, and `hashlib` for password hashing

<details open>
<summary></summary>

Python provides several native modules for utility functions and we use a lot of them when learning, but some of them are not suitable for production applications, as they can lead to security vulnerabilities. Starting with `pickle`, which is a serialization module that can serialize and deserialize Python objects:

-   Security Vulnerabilities: `pickle` can execute arbitrary code during deserialization, which can lead to code execution attacks.
-   Python Specific: `pickle` is Python-specific and not interoperable with other languages, which can cause compatibility issues, ofter with specific versions of Python.
-   Inefficient: `pickle` is not efficient for large data sets, as it can consume a lot of memory and CPU resources.
-   Lack of Schema Evolution: `pickle` doesn't provide a way to handle changes with data structures.

For example:

```python
# DANGEROUS: Pickle allows code execution
import pickle
import os

class MaliciousPayload:
    def __reduce__(self):
        # This will execute when the object is unpickled
        return (os.system, ('echo HACKED > hacked.txt',))

# Create a malicious pickle
malicious_data = pickle.dumps(MaliciousPayload())

# Later, when someone unpickles this data...
pickle.loads(malicious_data)  # Executes os.system('echo HACKED > hacked.txt')
```

Here are some safe alternatives to `pickle` for some use cases, starting with `JSON` for general use:

```python
import json

# Serialization
data = {"user": "alice", "permissions": ["read", "write"], "score": 95}
serialized = json.dumps(data)
with open("data.json", "w") as f:
    f.write(serialized)

# Deserialization
with open("data.json", "r") as f:
    loaded_data = json.loads(f.read())
```

Another common (mis)use of `pickle` is for Machine Learning models. There are better alternatives for this; first, framework specific serializations: for example, in `PyTorch` (also works for other big frameworks such as `TensorFlow` and `scikit-learn`):

```python
import torch
import torch.nn as nn

# Define a model
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return torch.softmax(self.fc2(x), dim=1)

# Create and train model
model = SimpleModel()
# train the model...

# Save just the model weights
torch.save(model.state_dict(), 'model_weights.pt')

# Save the entire model
torch.save(model, 'model_full.pt')

# To load weights into a model instance
new_model = SimpleModel()
new_model.load_state_dict(torch.load('model_weights.pt'))

# To load the entire model (less recommended)
loaded_model = torch.load('model_full.pt')
```

Another alternative is to use `ONNX` for interoperability between different frameworks:

```python
import torch
import onnx
import onnxruntime

# PyTorch model
model = SimpleModel()
# train the model...

# Export to ONNX
dummy_input = torch.randn(1, 784)  # Example input
torch.onnx.export(
    model,                  # Model being exported
    dummy_input,            # Example input
    "model.onnx",           # Output file
    export_params=True,     # Store the trained weights
    opset_version=12,       # ONNX version
    do_constant_folding=True,  # Optimization
    input_names=['input'],  # Names for inputs
    output_names=['output'],  # Names for outputs
    dynamic_axes={'input': {0: 'batch_size'},  # Variable batch size
                 'output': {0: 'batch_size'}}
)

# Verify the model
onnx_model = onnx.load("model.onnx")
onnx.checker.check_model(onnx_model)

# Run inference with ONNX Runtime
ort_session = onnxruntime.InferenceSession("model.onnx")
outputs = ort_session.run(
    None,
    {"input": dummy_input.numpy()}
)
```

Another framework agnostic solution that can be used for other use cases, such as caching, is `joblib`:

```python
import joblib
import numpy as np
import json

class SafeModel:
    def __init__(self):
        self.weights = {}
        self.architecture = {}

    def add_layer(self, layer_name, weights, biases):
        self.weights[layer_name] = {
            'weights': weights,
            'biases': biases
        }

    def set_architecture(self, architecture_dict):
        self.architecture = architecture_dict

# Create a safe representation of your model
def convert_to_safe_model(original_model):
    safe_model = SafeModel()

    # Extract architecture (framework-specific)
    architecture = {
        'type': 'neural_network',
        'layers': [{'name': f'layer_{i}', 'type': str(type(layer))}
                  for i, layer in enumerate(original_model.layers)]
    }
    safe_model.set_architecture(architecture)

    # Extract weights (framework-specific)
    for i, layer in enumerate(original_model.layers):
        weights = layer.get_weights()
        if len(weights) >= 2:  # Has weights and biases
            safe_model.add_layer(f'layer_{i}', weights[0], weights[1])

    return safe_model

# Save using joblib
def save_model_safely(model, filename):
    safe_model = convert_to_safe_model(model)

    # Save architecture as JSON
    with open(f"{filename}_arch.json", 'w') as f:
        json.dump(safe_model.architecture, f)

    # Save weights using joblib (efficient for numpy arrays)
    joblib.dump(safe_model.weights, f"{filename}_weights.joblib", compress=3)

# Load the model (framework-specific reconstruction)
def load_model_safely(filename, model_class):
    # Load architecture
    with open(f"{filename}_arch.json", 'r') as f:
        architecture = json.load(f)

    # Load weights
    weights = joblib.load(f"{filename}_weights.joblib")

    # Reconstruct model (framework-specific)
    # This is a simplified example
    model = model_class()
    for layer_name, layer_weights in weights.items():
        layer_index = int(layer_name.split('_')[1])
        model.layers[layer_index].set_weights([
            layer_weights['weights'],
            layer_weights['biases']
        ])

    return model
```

Another module largely used for learning and prototyping is `random`, which is a module that provides functions for generating random numbers and sequences. Here are some reasons to avoid `random`, mainly for cryptography:

-   Predictability: `random` is not suitable for cryptographic purposes, as the generated numbers are not truly random and can be predicted after observing enough values.
-   Seed Vulnerability: `random` uses a seed to generate pseudo-random numbers, which can be predictable if the seed is known.
-   Not designed for Security: `random` is designed for simulations and testing, not for security-critical applications that require unpredictability.

For example:

```python
# INSECURE: Using random for security purposes
import random

# Generate a "random" token
def generate_insecure_token(length=16):
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return ''.join(random.choice(chars) for _ in range(length))

# Create a password reset token
reset_token = generate_insecure_token(32)  # Predictable if random state is known
```

An alternative would be to use the `secrets` module, which is designed for generating cryptographically secure random numbers and sequences:

```python
import secrets
import string

# Generate a secure random token
def generate_secure_token(length=16):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

# Create a password reset token
reset_token = generate_secure_token(32)

# Generate a secure URL-safe token
url_token = secrets.token_urlsafe(32)

# Generate random bytes
random_bytes = secrets.token_bytes(32)
```

Or the `criptography` module, which is a more advanced library for cryptographic operations:

```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import os
import base64

# Generate a key from a password
def derive_key(password, salt=None):
    if salt is None:
        salt = os.urandom(16)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )

    key = kdf.derive(password.encode())
    return key, salt

# Usage
key, salt = derive_key("user_password")
```

Here we also used `os.urandom`, which is a function that generates cryptographically secure random bytes, suitable for cryptographic operations.

Finally, here's why it's better to avoid `hashlib` for password hashing:

-   Speed: `hashlib` is designed for fast hashing, which is not suitable for password hashing, as it can be brute-forced quickly.
-   Lack of Salt: `hashlib` doesn't provide a way to add a salt to the password, which is crucial for password hashing, and manual salt handling is error-prone and can lead to security vulnerabilities.
-   No Key Stretching: `hashlib` lacks built-in iteration/work factor adjustments, which are essential for password hashing to slow down brute-force attacks.
-   No Memory Hardness: `hashlib` doesn't provide memory-hard hashing algorithms, which are resistant to GPU and ASIC attacks.

For example:

```python
# INSECURE: Using hashlib directly for passwords
import hashlib

def hash_password_insecure(password):
    # Simple SHA-256 hashing - much too fast for password hashing
    return hashlib.sha256(password.encode()).hexdigest()

# Even adding a salt isn't enough
def hash_password_with_salt_still_insecure(password, salt):
    return hashlib.sha256((password + salt).encode()).hexdigest()
```

A safe alternative is to use `passlib`, which is a library specifically designed for password hashing and verification:

```python
from passlib.hash import argon2, pbkdf2_sha256, bcrypt

# Using Argon2 (recommended)
def hash_password_argon2(password):
    return argon2.hash(password)

def verify_password_argon2(password, hash):
    return argon2.verify(password, hash)

# Using PBKDF2
def hash_password_pbkdf2(password):
    # 29000 iterations by default
    return pbkdf2_sha256.hash(password)

def verify_password_pbkdf2(password, hash):
    return pbkdf2_sha256.verify(password, hash)

# Using bcrypt
def hash_password_bcrypt(password):
    return bcrypt.hash(password)

def verify_password_bcrypt(password, hash):
    return bcrypt.verify(password, hash)

# Usage
hashed = hash_password_argon2("user_secure_password")
is_valid = verify_password_argon2("user_secure_password", hashed)  # True
```

Or the `argon2-cffi` module, which is a Python binding for the Argon2 hashing algorithm, which is memory-hard:

```python
from argon2 import PasswordHasher

def hash_password():
    # Create a password hasher with custom parameters
    ph = PasswordHasher(
        time_cost=3,  # Number of iterations
        memory_cost=65536,  # 64MB
        parallelism=4,  # Number of parallel threads
        hash_len=32,  # Length of the hash in bytes
        salt_len=16  # Length of the salt in bytes
    )

    # Hash a password
    def hash(password):
        return ph.hash(password)

    # Verify a password against a hash
    def verify(password, hash):
        try:
            ph.verify(hash, password)
            return True
        except:
            return False

    return hash, verify

# Usage
hash_func, verify_func = hash_password()
hashed = hash_func("secure_user_password")
is_valid = verify_func("secure_user_password", hashed)  # True
```

In summary, when developing production application in Python, it's recommended to avoid some built-in modules and functions and follow best practices for security with alternative implementations. Here are some key points to remember:

-   Avoid `pickle` for serialization, use `json` or framework-specific solutions.
-   Avoid `random` for cryptography, use `secrets` or `cryptography` for secure random numbers.
-   Avoid `hashlib` for password hashing, use `passlib` or `argon2-cffi` for secure password hashing.
-   Try using framework specific security and authentication solutions, as they are more secure and reliable than custom implementations.
-   Observes the general best practices for security and cryptography.
</details>

## Always use ORMs for database operations, never hard code SQL queries inside the code

<details open>
<summary></summary>

When working with databases in Python, it's important to use Object-Relational Mapping (ORM) libraries for database operations, which are very common in many use cases. Here's why it's important to use ORMs and avoid hard coding SQL queries inside the code, starting with Security Vulnerabilities: Hard coded SQL queries can be vulnerable to SQL injection attacks, as they can be manipulated by attackers to execute arbitrary SQL code given that we're using, for example, `f-strings` in Python. On the other hand, well developed ORMs provide built-in protection against SQL injection attacks, as they use parameterized queries and prepared statements to sanitize user input. For example:

```python
def get_user(username):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # VULNERABLE: Direct string interpolation
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    return cursor.fetchone()

# If username = "admin' OR '1'='1", this returns all users
```

With Alchemy:

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
engine = create_engine('sqlite:///database.db')
Session = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String)

def get_user(username):
    session = Session()
    # Parameters automatically sanitized
    user = session.query(User).filter(User.username == username).first()
    session.close()
    return user

# Even if username = "admin' OR '1'='1", this safely looks for that exact string
```

Another point is the automatic input validation: combining `Pydantic` models with `SQLAlchemy` will validate the data before is reaches your database, for example:

```python
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy.exc import IntegrityError

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    age: int = Field(..., gt=0, lt=120)

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

def create_user(user_data: dict):
    try:
        # Validates all inputs according to rules
        user_model = UserCreate(**user_data)

        session = Session()
        new_user = User(
            username=user_model.username,
            email=user_model.email,
            age=user_model.age
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        session.close()
        return new_user
    except ValueError as e:
        # Handle validation errors
        return {"error": str(e)}
    except IntegrityError:
        session.rollback()
        return {"error": "Username already exists"}
```

Another advantage is Database Agnostic Code, as ORMs usually provide an abstraction layer that allows you to write database-agnostic code, which can be useful when switching databases or running tests. For example:

```python
# SQLite-specific query
def get_users_with_recent_orders():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = """
    SELECT u.username, COUNT(o.id) as order_count
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE o.order_date > date('now', '-30 days')
    GROUP BY u.id
    """
    cursor.execute(query)
    return cursor.fetchall()

# Need to rewrite for PostgreSQL
def get_users_with_recent_orders():
    conn = psycopg2.connect("dbname=mydb user=postgres")
    cursor = conn.cursor()
    query = """
    SELECT u.username, COUNT(o.id) as order_count
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE o.order_date > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY u.id
    """
    cursor.execute(query)
    return cursor.fetchall()
```

With ORMs:

```python
from sqlalchemy import func, Column, Integer, String, ForeignKey, DateTime
from datetime import datetime, timedelta

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    orders = relationship("Order", back_populates="user")

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    order_date = Column(DateTime)
    user = relationship("User", back_populates="orders")

def get_users_with_recent_orders():
    session = Session()
    thirty_days_ago = datetime.now() - timedelta(days=30)

    # Works with SQLite, PostgreSQL, MySQL, etc.
    result = session.query(
        User.username,
        func.count(Order.id).label('order_count')
    ).join(User.orders).filter(
        Order.order_date > thirty_days_ago
    ).group_by(User.id).all()

    session.close()
    return result

# Switch databases by changing only the connection string:
# SQLite: engine = create_engine('sqlite:///database.db')
# PostgreSQL: engine = create_engine('postgresql://user:password@localhost/dbname')
# MySQL: engine = create_engine('mysql+pymysql://user:password@localhost/dbname')
```

With that, the code is also more Readable and Maintainable, as classes provide better structure than raw SQL strings.
ORMs also have built-in tools for migrations, which can help you manage database schema changes and versioning. For example, `Alembic` is a popular migration tool for SQLAlchemy that allows you to create and apply database migrations easily. Finally, ORMs enable IDE support for development with databases, as it will be able to keep track of classes, methods, types, and relationships, providing autocompletion, type checking, and refactoring tools, while raw SQL strings are just strings.

</details>
