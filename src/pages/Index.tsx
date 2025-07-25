// This page redirects to the landing page
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    window.location.href = "/";
  }, []);

  return null;
};

export default Index;
