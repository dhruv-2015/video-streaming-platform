import React from 'react';
import PageLayout from '@/components/layouts/PageLayout';

const AboutUs = () => {
  return (
    <PageLayout
      title="About Us"
      description="Learn more about our video streaming platform"
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            We're dedicated to providing a platform where creators can share their
            stories and connect with audiences worldwide. Our goal is to make
            video sharing accessible, engaging, and rewarding for everyone.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground">
            Founded in 2024, our platform has grown from a simple idea into a
            thriving community of creators and viewers. We believe in the power
            of video to educate, entertain, and inspire.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
          <ul className="list-disc list-inside text-muted-foreground">
            <li>Creativity and Innovation</li>
            <li>Community First</li>
            <li>Trust and Safety</li>
            <li>Accessibility for All</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  );
};

export default AboutUs; 

// export default function AboutUs() {
//   return (
//     <div className="max-w-3xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">About Us</h1>
//       <p className="mb-4">
//         Welcome to MyTube, your go-to platform for sharing and discovering amazing video content. Founded in 2023, we've
//         quickly grown to become one of the most popular video-sharing websites on the internet.
//       </p>
//       <p className="mb-4">
//         Our mission is to give everyone a voice and show them the world. We believe that everyone deserves to have a
//         voice, and that the world is a better place when we listen, share and build community through our stories.
//       </p>
//       <p className="mb-4">At MyTube, we're committed to:</p>
//       <ul className="list-disc list-inside mb-4">
//         <li>Freedom of Expression</li>
//         <li>Freedom of Information</li>
//         <li>Freedom of Opportunity</li>
//         <li>Freedom to Belong</li>
//       </ul>
//       <p>
//         We're constantly evolving to provide the best possible experience for our users. Whether you're here to share
//         your own videos, watch content from creators around the world, or simply explore new ideas, MyTube is here for
//         you.
//       </p>
//     </div>
//   )
// }

