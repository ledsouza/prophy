import { Link } from "react-router-dom";

function Header() {
    return (
        <header className="p-4">
            <nav className="flex justify-center gap-4 text-2xl">
                <Link to={"./"}>Home</Link>
                <Link to={"./login"}>Login</Link>
            </nav>
        </header>
    );
}

export default Header;
