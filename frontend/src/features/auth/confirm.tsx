import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import axios from "axios";
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";



const formSchema = z.object({
  email: z.string().email("Invalid email address").nonempty("Email cannot be empty"),
  otp: z.string({
    required_error: "Verification code is required",
  }).min(6, {
    message: "Your verification code must be 6 characters.",
  }),
})



function onSubmit(values: z.infer<typeof formSchema>) {
  axios.post('http://localhost:5000/confirm', values).then((response) => {
    if (response.status === 200) {
      localStorage.clear();
      localStorage.setItem('nextPageAlert', 'Your account has been confirmed successfully. You can now login.');
      window.location.href = '/login';
    }
  }).catch((error) => {
    toast.error(error.response?.data?.error || "An error occurred during confirmation");
  })
}



export default function Confirm() {
  useEffect(() => {
    if (localStorage.getItem("nextPageAlert")) {
      setTimeout(() => {
        toast.error(localStorage.getItem("nextPageAlert"));
        localStorage.removeItem("nextPageAlert");
      }, 1500);
    }
  }, []);
  const navigate = useNavigate();
  const storedEmail = localStorage.getItem("email") || "";
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: storedEmail,
      otp: "",
    },
  })
  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-black/10 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow">
          <AnimatedThemeToggler />
        </div>
      </div>
      <div className="flex flex-row min-h-screen justify-center items-center">
        <Toaster />
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-2xl">Confirm account</CardTitle>
            <CardDescription>
              To complete your registration, confirm your account by checking your email and entering the OTP code we sent you.
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Insert your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Token</FormLabel>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <FormControl>          
                        <InputOTP maxLength={6} {...field} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit">Confirm your account</Button> 
            </form>
          </Form>  
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t" style={{ marginTop: "10px", marginBottom: "10px" }}>
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={()=>{navigate('/login')}}>Login</Button> 
            <Button type="button" variant="outline" onClick={()=>{navigate('/register')}}>Register</Button> 
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
