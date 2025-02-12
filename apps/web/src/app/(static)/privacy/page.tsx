import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';

const PrivacyPolicy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      description="Learn how we protect and handle your data"
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly to us when you create an account,
            upload videos, or interact with content. This includes:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground">
            <li>Name and email address</li>
            <li>Profile information</li>
            <li>Content you upload</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use the information we collect to provide, maintain, and improve our
            services. This includes personalizing content, analyzing platform usage,
            and ensuring platform security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the Internet is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy; 

// export default function PrivacyPolicy() {
//   return (
//     <div className="max-w-3xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
//       <p className="mb-4">
//         At MyTube, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and
//         safeguard your information when you use our website and services.
//       </p>
//       <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
//       <p className="mb-4">
//         We collect information you provide directly to us, such as when you create an account, upload or view videos, or
//         communicate with us. This may include your name, email address, and content you upload.
//       </p>
//       <h2 className="text-2xl font-semibold mb-2">How We Use Your Information</h2>
//       <p className="mb-4">
//         We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to
//         protect MyTube and our users.
//       </p>
//       <h2 className="text-2xl font-semibold mb-2">Sharing Your Information</h2>
//       <p className="mb-4">
//         We do not share your personal information with companies, organizations, or individuals outside of MyTube except
//         in the following cases:
//       </p>
//       <ul className="list-disc list-inside mb-4">
//         <li>With your consent</li>
//         <li>For external processing</li>
//         <li>For legal reasons</li>
//       </ul>
//       <h2 className="text-2xl font-semibold mb-2">Your Choices</h2>
//       <p className="mb-4">
//         You can access and update certain information about your account through your account settings. You may also
//         request to have your account deleted.
//       </p>
//       <h2 className="text-2xl font-semibold mb-2">Changes to This Policy</h2>
//       <p className="mb-4">
//         We may change this privacy policy from time to time. We will post any privacy policy changes on this page and,
//         if the changes are significant, we will provide a more prominent notice.
//       </p>
//       <p>If you have any questions about this Privacy Policy, please contact us at privacy@mytube.com.</p>
//     </div>
//   )
// }

