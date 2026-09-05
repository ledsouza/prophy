---
paths:
  - "frontend/app/redux/**"
---

The best practices for defining HTTP payload types in TypeScript focus on consistency, explicitness, and maintaining a single source of truth for your API contract. Key practices include choosing between interface and type, ensuring type safety on both the request and response sides, and managing complex or partial payloads.

## 1. Choose between interface and type

The main difference is that an interface can be "reopened" to add new properties via declaration merging, while a type alias cannot. For defining object shapes like HTTP payloads, either can be used, and the choice is often a matter of team preference.

Favor type for flexibility. type aliases can describe a wider range of types, including primitives, unions, and intersections, making them highly versatile for representing complex API responses.
Use interface for object-oriented inheritance. When defining object shapes that extend other shapes, using interface ... extends ... can provide slightly better compiler performance and clearer documentation in some IDEs than intersection types (&).

Example using a type:

```typescript
// Define a user's data
type User = {
    id: string;
    username: string;
    email: string;
};

// Define a request payload for creating a new user
type CreateUserPayload = {
    username: string;
    email: string;
};

// Define the response from the API
type ApiResponse<T> = {
    success: boolean;
    data: T;
};

// Use the types in an async function
async function createUser(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    // ... API call logic
}
```

Example using an interface:

```typescript
interface User {
    id: string;
    username: string;
    email: string;
}

interface CreateUserPayload {
    username: string;
    email: string;
}

// Interfaces can also use generics
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

async function createUser(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    // ... API call logic
}
```

## 2. Isolate and reuse API types

Define your API types in a centralized, separate location and share them between the front-end and back-end when possible. This ensures both sides of the application work with the same data contract.
Organize types by functionality. Create a types directory or file for API-related types to prevent clutter and improve discoverability.
Share types for consistency. If using a monorepo or a shared package, you can import the same types, guaranteeing a consistent API contract.

## 3. Handle partial payloads for PATCH requests

The PATCH HTTP method requires defining a type for a payload that may contain only a subset of an object's properties. TypeScript's built-in utility types are ideal for this.
Use Partial<T>: This utility type constructs a type with all properties of T set to optional. This is perfect for defining a PATCH request payload.

Example using Partial<T>:

```typescript
interface User {
    id: string;
    name: string;
    email: string;
}

type UpdateUserPayload = Partial<Omit<User, "id">>;

async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    // ... API call logic
}
```

## 4. Ensure runtime validation for incoming data

Even with strong TypeScript types, data coming from an external HTTP source is not guaranteed to conform to the expected shape.
Type cast on arrival: The safest and most common practice is to type-cast the result from the API call, performing an explicit assertion as close to the data source as possible.
Perform runtime validation: For critical applications, supplement your static typing with a runtime validation library like zod or yup. These libraries let you define a validation schema from which you can also infer your TypeScript type.

Example with runtime validation using zod:

```typescript
import { z } from "zod";

// Define schema for the API response
const UserSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
});

// Infer the TypeScript type directly from the schema
type User = z.infer<typeof UserSchema>;

async function fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    const rawData = await response.json();

    // Validate and parse the raw data against the schema
    const validatedData = UserSchema.parse(rawData);
    return validatedData;
}
```

## 5. Use generics for standard API response wrappers

Standardized API response formats often include metadata like success status and error messages alongside the payload data. Use a generic type to represent this pattern cleanly.
Define a generic ApiResponse type. This allows you to encapsulate your data within a consistent wrapper without losing type safety.

Example with a generic API response:

```typescript
// Generic type for a successful API response
type SuccessResponse<T> = {
    success: true;
    data: T;
};

// Generic type for a failed API response
type ErrorResponse = {
    success: false;
    error: {
        message: string;
        code?: string;
    };
};

// Define a union type for all possible outcomes
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

async function fetchProduct(id: string): Promise<ApiResponse<Product>> {
    // ... API call logic
}
```

## 6. Define separate types for different data representations

If an entity's data changes depending on the API endpoint, define separate types to reflect the different shapes.
Example: UserSummary vs. FullUser. A GET /users endpoint might return a list of UserSummary objects, while a GET /users/:id endpoint returns a FullUser object with more details.

Example with separate types:

```typescript
// Type for a list item
interface UserSummary {
    id: string;
    username: string;
}

// Type for a detailed item
interface User extends UserSummary {
    email: string;
    createdAt: string;
}

async function fetchUsers(): Promise<UserSummary[]> {
    // ...
}

async function fetchUser(id: string): Promise<User> {
    // ...
}
```
