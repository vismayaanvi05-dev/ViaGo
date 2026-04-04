import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Shield } from 'lucide-react';

const EmailOTPLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Required Field",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await axios.post(`${API_BASE_URL}/auth/send-email-otp`, { email });
      
      toast({
        title: "OTP Sent",
        description: `Check your email for OTP. (Dev: ${response.data.otp})`,
        variant: "default",
      });
      
      setStep('otp');
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await axios.post(`${API_BASE_URL}/auth/verify-email-otp`, {
        email,
        otp
      });
      
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
        title: "Verification Failed",
        description: error.response?.data?.detail || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Email OTP Login</CardTitle>
          <CardDescription className="text-center">
            {step === 'email' ? 'Enter your email to receive OTP' : 'Enter the OTP sent to your email'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <div className="text-center">
                <a href="/admin-login" className="text-sm text-blue-600 hover:underline">
                  Back to Password Login
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
                <p className="text-sm text-gray-500 text-center">OTP sent to {email}</p>
              </div>
              
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                >
                  Change Email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500">
          Secure email-based authentication
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailOTPLogin;
