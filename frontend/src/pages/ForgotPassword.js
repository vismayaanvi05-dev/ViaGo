import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState('email'); // 'email', 'otp', 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword
      });
      
      toast({
        title: "Success",
        description: "Password reset successfully!",
        variant: "default",
      });
      
      setStep('success');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/admin-login');
      }, 2000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.detail || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <KeyRound className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            {step === 'email' && 'Enter your email to receive OTP'}
            {step === 'otp' && 'Enter OTP and set new password'}
            {step === 'success' && 'Password reset successful!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'email' && (
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
                <a href="/admin-login" className="text-sm text-purple-600 hover:underline">
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                />
                <p className="text-sm text-gray-500 text-center">OTP sent to {email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Change Email
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-700 font-medium">✓ Password Reset Complete</p>
                <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
              </div>
              <Button onClick={() => navigate('/admin-login')} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500">
          Secure password recovery
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
