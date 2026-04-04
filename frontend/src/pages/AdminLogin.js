import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = ({ title, description, redirectPath, colorScheme = "orange" }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Required Fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      // Store token and user
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      login(response.data.access_token, response.data.user);
      
      toast({
        title: "Login Successful",
        description: `Welcome ${response.data.user.name}!`,
      });
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'super_admin') {
        navigate('/super-admin');
      } else if (role === 'tenant_admin') {
        navigate('/tenant-admin');
      } else if (role === 'vendor') {
        navigate('/vendor-admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gradientClass = colorScheme === "orange" 
    ? "bg-gradient-to-br from-orange-50 to-red-50" 
    : colorScheme === "blue"
    ? "bg-gradient-to-br from-blue-50 to-indigo-50"
    : "bg-gradient-to-br from-purple-50 to-pink-50";

  return (
    <div className={`min-h-screen flex items-center justify-center ${gradientClass} p-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (Email)</Label>
              <Input
                id="username"
                type="email"
                placeholder="admin@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="text-center">
              <a href="/email-otp-login" className="text-sm text-blue-600 hover:underline">
                Login with Email OTP
              </a>
            </div>
            <div className="text-center">
              <a href="/forgot-password" className="text-sm text-gray-600 hover:underline">
                Forgot Password?
              </a>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500">
          Credentials are provided by your administrator
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
