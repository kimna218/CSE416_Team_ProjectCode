import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/Navbar.css'; 
import { Container, Nav, Navbar, Button, Form } from 'react-bootstrap';
import { FaSearch, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AppNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Navbar bg="light" expand="lg" className="custom-navbar shadow-sm py-3">
      <Container>
        <Navbar.Brand href="#" className="navbar-logo">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        <Nav className="mx-auto navbar-buttons">
          <Button variant="outline-primary" className="nav-btn" onClick={() => navigate('/home')}>Home</Button>
          <Button variant="outline-primary" className="nav-btn" onClick={() => navigate('/category')}>Category</Button>
          <Button variant="outline-primary" className="nav-btn" onClick={() => navigate('/feed')}>Feed</Button>
        </Nav>

        <Form className="d-flex align-items-center navbar-icons">
          <Button variant="outline-secondary" className="icon-btn me-2" onClick={() => navigate('/search-result')}>
            <FaSearch />
          </Button>
          <Button variant="outline-secondary" className="icon-btn" onClick={() => navigate('/profile')}>
            <FaUser />
          </Button>
        </Form>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
