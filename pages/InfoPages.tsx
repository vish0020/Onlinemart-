
import React from 'react';
import { Shield, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Shared';

const PageLayout = ({ title, icon: Icon, children }: any) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto p-6 pb-20 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 gap-1 text-gray-500 hover:bg-transparent hover:text-primary">
        <ArrowLeft size={16} /> Back
      </Button>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary-dark">
                <Icon size={24} />
            </div>
            <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
        </div>
        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-600 dark:text-gray-300 space-y-4">
            {children}
        </div>
      </div>
    </div>
  );
};

export const TermsPage = () => (
  <PageLayout title="Terms & Conditions" icon={FileText}>
    <p className="text-xs text-gray-400 mb-4 font-mono">Last Updated: {new Date().toLocaleDateString()}</p>
    
    <p>Welcome to OnlineMart (“we”, “our”, “us”). By accessing or using this website you agree to the following Terms & Conditions. If you do not agree, please do not use our services.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">1. Eligibility</h3>
    <p>You must be 18+ years old to place an order.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">2. General Use</h3>
    <ul className="list-disc pl-5 space-y-1">
        <li>You must provide accurate details while ordering.</li>
        <li>We reserve the right to cancel or refuse any order.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">3. Products</h3>
    <ul className="list-disc pl-5 space-y-1">
        <li>Product images may slightly differ due to lighting or screen differences.</li>
        <li>All descriptions and pricing are subject to change.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">4. Pricing & Payment</h3>
    <ul className="list-disc pl-5 space-y-1">
        <li>All prices are shown in INR.</li>
        <li>We support the payment methods shown at checkout.</li>
        <li>Pricing may include delivery charges.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">5. Delivery</h3>
    <ul className="list-disc pl-5 space-y-1">
        <li>Delivery time is an estimate only.</li>
        <li>Delays may occur due to courier or unforeseen situations.</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">6. No Return and No Refund Policy</h3>
    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900 text-red-700 dark:text-red-300 font-medium">
        Once a purchase is completed and delivered, the product cannot be returned or refunded except in cases of wrong or damaged item delivery.
    </div>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">7. Order Cancellation</h3>
    <p>We may cancel an order if:</p>
    <ul className="list-disc pl-5 space-y-1">
        <li>Payment is not completed</li>
        <li>Wrong delivery address</li>
        <li>Product is out of stock</li>
        <li>Any fraudulent activity is detected</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">8. User Account</h3>
    <p>Users are responsible for:</p>
    <ul className="list-disc pl-5 space-y-1">
        <li>Keeping login secure</li>
        <li>Not sharing account details</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">9. Limitation of Liability</h3>
    <p>We are not responsible for:</p>
    <ul className="list-disc pl-5 space-y-1">
        <li>Improper product use</li>
        <li>Third-party shipping delays</li>
        <li>Customer mistakes in address or information</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">10. Governing Law</h3>
    <p>These terms are governed by the laws of India.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">11. Changes to Terms</h3>
    <p>We can update these terms anytime. Continued use means you accept the new terms.</p>
  </PageLayout>
);

export const PrivacyPage = () => (
  <PageLayout title="Privacy Policy" icon={Shield}>
    <p className="text-xs text-gray-400 mb-4 font-mono">Last Updated: {new Date().toLocaleDateString()}</p>
    <p>We respect your privacy and protect your data. This Privacy Policy explains how we collect, use and secure your information.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">1. Information We Collect</h3>
    <p>We may collect the following:</p>
    <ul className="list-disc pl-5 space-y-1">
        <li>Name</li>
        <li>Mobile number</li>
        <li>Address</li>
        <li>Email ID</li>
        <li>Order history</li>
        <li>Payment mode (not full card/UPI details)</li>
    </ul>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">2. How We Use Your Information</h3>
    <p>We use your information for:</p>
    <ul className="list-disc pl-5 space-y-1">
        <li>Processing orders</li>
        <li>Delivery and shipping</li>
        <li>Customer support</li>
        <li>Account login & security</li>
        <li>Notifications & updates</li>
    </ul>
    <p className="mt-2 font-medium text-primary-dark">We do not sell, share, or rent your personal data to third parties.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">3. Payments</h3>
    <p>UPI/Card/Net-Banking is processed by secure payment providers. We never store card/UPI details.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">4. Cookies</h3>
    <p>We may use cookies to improve user experience.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">5. Data Security</h3>
    <p>We follow industry standards to protect your information.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">6. Third-Party Services</h3>
    <p>We may use third-party service providers (Payment gateways, Courier partners, Firebase). They only access data necessary for service.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">7. User Rights</h3>
    <p>Users can Update personal info, Modify address, or request to Delete account.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">8. Data Retention</h3>
    <p>We keep order data for legal and tax reasons.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">9. Children’s Privacy</h3>
    <p>We do not allow accounts for users under 18.</p>

    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">10. Changes to Policy</h3>
    <p>We may update this policy anytime.</p>
  </PageLayout>
);
