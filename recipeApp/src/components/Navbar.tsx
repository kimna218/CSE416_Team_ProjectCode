import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Navbar.css";
import { Container, Nav, Navbar, Button, Form } from "react-bootstrap";
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
    <Navbar bg="light" expand="md" className="custom-navbar shadow-sm py-3">
      <Container className="d-grid navbar-grid">
        <div className="navbar-left">
          <Navbar.Brand onClick={() => navigate("/")} className="navbar-logo">
            <img src="/images/logo.png" alt="Logo" />
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="center-collapse" />

        <Navbar.Collapse id="center-collapse" className="w-100">
          <div className="navbar-center">
          <Nav className="navbar-buttons">
            <Button
              variant="outline-primary"
              className="nav-btn"
              onClick={() => navigate("/category")}
            >
              Category
            </Button>
            <Button
              variant="outline-primary"
              className="nav-btn"
              onClick={() => navigate("/feed")}
            >
              Feed
            </Button>
            <Button
              variant="outline-primary"
              className="nav-btn"
              onClick={() => navigate("/MyRecipe")}
            >
              My Recipe
            </Button>
          </Nav>
        </div>
        </Navbar.Collapse>

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
    </Navbar>
  );
};

export default AppNavbar;
