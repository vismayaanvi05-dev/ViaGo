import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    // Auto-detect role based on phone number
    let detectedRole = 'customer'; // default
    if (phone === '9999999999') detectedRole = 'super_admin';
    else if (phone === '8888888888') detectedRole = 'tenant_admin';
    else if (phone === '9333333333') detectedRole = 'delivery';
    
    setRole(detectedRole);

    setLoading(true);
    try {
      const response = await authAPI.sendOTP(phone, detectedRole);
      
      toast({
        title: "OTP Sent",
        description: `OTP: ${response.data.otp}`,
        variant: "success",
      });
      
      setOtpSent(true);
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
      const response = await authAPI.verifyOTP(phone, otp, role, name || null);
      
      login(response.data.access_token, response.data.user);
      
      toast({
        title: "Login Successful",
        description: `Welcome ${response.data.user.name}!`,
      });
      
      // Navigate based on role
      switch (response.data.user.role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'tenant_admin':
          navigate('/tenant-admin');
          break;
        case 'customer':
          navigate('/customer');
          break;
        case 'delivery':
          navigate('/delivery');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">HyperServe</CardTitle>
          <CardDescription className="text-center">
            {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  required
                />
                <p className="text-xs text-gray-500">
                  Use 9111111111 for Customer, 8888888888 for Tenant Admin, 9999999999 for Super Admin
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
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
                />
                <p className="text-sm text-gray-500">OTP sent to {phone}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Your Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-xs text-gray-500">Required for new users</p>
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
                    setStep('phone');
                    setOtp('');
                  }}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500">
          Multi-tenant SaaS Platform for Food Delivery
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
