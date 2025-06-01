import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Navbar.css";
import { Container, Navbar, Button, Form } from "react-bootstrap";
import { FaSearch, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { setCurrentLang } from "../components/language";

const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.photoURL) {
        setUserPhoto(user.photoURL);
      } else {
        setUserPhoto(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
    <Navbar bg="light" expand="md" className="custom-navbar shadow-sm py-3">
      <Container className="d-grid navbar-grid">
        <div className="navbar-left">
          <Navbar.Brand onClick={() => navigate("/")} className="navbar-logo">
            <img src="/images/logo.png" alt="Logo" />
          </Navbar.Brand>
        </div>

            <div className="navbar-center desktop-menu">
      <Button className="nav-btn" onClick={() => navigate("/category")}>Category</Button>
      <Button className="nav-btn" onClick={() => navigate("/feed")}>Feed</Button>
      <Button className="nav-btn" onClick={() => navigate("/MyRecipe")}>My Recipe</Button>
    </div>

        <Navbar.Toggle aria-controls="center-collapse" className="custom-toggle" />

        <div className="navbar-right">
          <Form className="d-flex align-items-center navbar-icons">
            <Button variant="link" onClick={() => setCurrentLang("ko")}>
              🇰🇷
            </Button>
            <Button
              variant="link"
              onClick={() => setCurrentLang("en")}
              className="me-2"
            >
              🇺🇸
            </Button>

            <Button
              variant="outline-secondary"
              className="icon-btn me-2"
              onClick={() => navigate("/search-result")}
            >
              <FaSearch />
            </Button>

            {userPhoto ? (
              <Button
                variant="outline-secondary"
                className="icon-btn profile-photo-btn"
                onClick={() => navigate("/profile")}
              >
                <img
                  src={userPhoto}
                  alt="Profile"
                  style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                />
              </Button>
            ) : (
              <Button
                variant="outline-secondary"
                className="icon-btn"
                onClick={() => navigate("/profile")}
              >
                <FaUser />
              </Button>
            )}
          </Form>
        </div>
      </Container>

      <div className="no-display">
        <Navbar.Collapse>
          <div className="mobile-menu">
            <Button className="nav-btn" onClick={() => navigate("/category")}>Category</Button>
            <Button className="nav-btn" onClick={() => navigate("/feed")}>Feed</Button>
            <Button className="nav-btn" onClick={() => navigate("/MyRecipe")}>My Recipe</Button>
          </div>
        </Navbar.Collapse>
      </div>
    </Navbar>
    </>
  );
};

export default AppNavbar;
