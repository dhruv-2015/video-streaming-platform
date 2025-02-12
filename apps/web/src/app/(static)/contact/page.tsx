"use client";
import React from "react";
import PageLayout from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactUs = () => {
  return (
    <PageLayout
      title="Contact Us"
      description="We're always here to help. If you have any questions, concerns, or feedback, please don't hesitate to reach out to us using one of the methods below:"
    >
      <div className="mb-5 space-y-4">
        <h2 className="text-2xl font-semibold">Customer Support / Business Inquiries</h2>
      </div>
      <div className="max-w-2xl">
        <form className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input id="name" placeholder="Your name" />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <Input id="subject" placeholder="How can we help?" />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Tell us more about your inquiry..."
              rows={5}
            />
          </div>

          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold">Other Ways to Reach Us</h2>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <strong>Email:</strong> support@videoplatform.com
            </p>
            <p className="text-muted-foreground">
              <strong>Address:</strong> 123 Streaming Street, Digital City,
              12345
            </p>
            <p className="text-muted-foreground">
              <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactUs;

// export default function ContactUs() {
//   return (
//     <div className="max-w-3xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
//       <p className="mb-4">
//         We're always here to help. If you have any questions, concerns, or feedback, please don't hesitate to reach out
//         to us using one of the methods below:
//       </p>
//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Customer Support</h2>
//         <p>Email: support@mytube.com</p>
//         <p>Phone: +1 (555) 123-4567</p>
//         <p>Hours: Monday - Friday, 9am - 5pm EST</p>
//       </div>
//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Business Inquiries</h2>
//         <p>Email: business@mytube.com</p>
//       </div>
//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Press</h2>
//         <p>Email: press@mytube.com</p>
//       </div>
//       <div>
//         <h2 className="text-xl font-semibold mb-2">Mailing Address</h2>
//         <p>MyTube, Inc.</p>
//         <p>123 Video Street</p>
//         <p>San Francisco, CA 94105</p>
//         <p>United States</p>
//       </div>
//     </div>
//   )
// }
