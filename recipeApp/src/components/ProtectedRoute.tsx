import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      else setChecking(false);
    });

    return () => unsubscribe();
  }, []);


  if (checking) return <p>로그인 여부 확인 중...</p>;

  return <>{children}</>;
};

export default ProtectedRoute;
