# Default Legal Content for HyperServe Platform

DEFAULT_PRIVACY_POLICY = """
PRIVACY POLICY

Last Updated: [Date]

1. INFORMATION WE COLLECT

We collect information you provide directly to us when you:
- Create an account
- Place an order
- Contact customer support
- Use our services

Information collected includes:
- Name and contact information (email, phone number)
- Delivery addresses
- Payment information
- Order history and preferences

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
- Process and deliver your orders
- Communicate with you about orders and services
- Improve our services and user experience
- Send promotional offers (with your consent)
- Prevent fraud and enhance security

3. INFORMATION SHARING

We may share your information with:
- Delivery partners (to complete your orders)
- Vendors/restaurants (to prepare your orders)
- Payment processors (to process transactions)
- Service providers (for analytics and improvements)

We do not sell your personal information to third parties.

4. DATA SECURITY

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications
- Withdraw consent at any time

6. LOCATION DATA

We collect location data to:
- Show nearby stores and restaurants
- Calculate delivery fees
- Provide accurate delivery estimates
- Enable order tracking

You can disable location services in your device settings.

7. COOKIES AND TRACKING

We use cookies and similar technologies to:
- Remember your preferences
- Analyze usage patterns
- Personalize your experience
- Improve our services

8. CHILDREN'S PRIVACY

Our services are not intended for children under 13 years of age. We do not knowingly collect information from children.

9. CHANGES TO THIS POLICY

We may update this privacy policy from time to time. We will notify you of significant changes via email or app notification.

10. CONTACT US

For privacy-related questions or concerns, please contact us at:
Email: [Your Support Email]
Phone: [Your Support Phone]

By using our services, you agree to this Privacy Policy.
"""

DEFAULT_TERMS_AND_CONDITIONS = """
TERMS AND CONDITIONS

Last Updated: [Date]

1. ACCEPTANCE OF TERMS

By accessing or using our platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.

2. SERVICE DESCRIPTION

We operate a hyperlocal delivery platform connecting customers with local stores, restaurants, and service providers for:
- Food delivery
- Grocery shopping
- Laundry services
- Other local services

3. USER ACCOUNTS

3.1 Account Creation
- You must provide accurate and complete information
- You are responsible for maintaining account security
- One person or business per account
- You must be at least 18 years old

3.2 Account Security
- Keep your password confidential
- Notify us immediately of unauthorized access
- You are responsible for all activities under your account

4. ORDERS AND PAYMENTS

4.1 Placing Orders
- All orders are subject to acceptance
- Prices are listed in your local currency
- We reserve the right to refuse any order
- Product availability is not guaranteed

4.2 Pricing
- Prices include applicable taxes unless stated otherwise
- Delivery charges apply as per distance/order value
- Prices may change without notice

4.3 Payment Methods
- Cash on Delivery (COD)
- Credit/Debit Cards
- Digital Wallets
- UPI and other online payment methods

4.4 Payment Terms
- Payment is due at the time of order placement
- Failed payments may result in order cancellation
- Refunds processed as per our Refund Policy

5. DELIVERY

5.1 Delivery Areas
- Services available in select locations
- Delivery times are estimates, not guarantees
- Weather and traffic may affect delivery times

5.2 Delivery Instructions
- Provide accurate delivery addresses
- Be available to receive your order
- Contact driver if you have special instructions

5.3 Failed Deliveries
- Orders may be cancelled if delivery fails
- Re-delivery charges may apply
- Refunds subject to our policies

6. CANCELLATIONS AND REFUNDS

6.1 Cancellation Policy
- Orders can be cancelled before preparation begins
- Cancellation fees may apply
- Refunds processed within 5-7 business days

6.2 Refund Policy
- Full refund for cancelled orders (before preparation)
- Partial refunds for incorrect/damaged items
- No refunds for quality preferences

7. USER CONDUCT

You agree NOT to:
- Use the platform for illegal activities
- Abuse, harass, or threaten delivery partners
- Provide false information
- Attempt to manipulate prices or reviews
- Reverse engineer our technology
- Violate any applicable laws

8. INTELLECTUAL PROPERTY

All content, logos, and trademarks are owned by us or licensed to us. You may not use them without permission.

9. LIMITATION OF LIABILITY

We are not liable for:
- Indirect, incidental, or consequential damages
- Food quality issues (vendor responsibility)
- Delivery delays beyond our control
- Force majeure events

Maximum liability limited to the order value.

10. THIRD-PARTY SERVICES

We work with independent vendors and delivery partners. We are not responsible for their actions or the quality of their products/services.

11. DISPUTE RESOLUTION

11.1 Customer Support
Contact us first to resolve issues:
Email: [Your Support Email]
Phone: [Your Support Phone]

11.2 Arbitration
Disputes not resolved through support will be subject to arbitration in [Your Jurisdiction].

12. MODIFICATIONS

We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.

13. TERMINATION

We may terminate or suspend your account for:
- Violation of these terms
- Fraudulent activity
- Abusive behavior
- Non-payment

14. GOVERNING LAW

These terms are governed by the laws of [Your Country/State].

15. CONTACT INFORMATION

For questions about these terms:
Email: [Your Support Email]
Phone: [Your Support Phone]
Website: [Your Website]

16. ENTIRE AGREEMENT

These terms constitute the entire agreement between you and us regarding use of our services.

By using our platform, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
"""

def get_default_privacy_policy():
    """Returns default privacy policy template"""
    return DEFAULT_PRIVACY_POLICY.strip()

def get_default_terms_and_conditions():
    """Returns default terms and conditions template"""
    return DEFAULT_TERMS_AND_CONDITIONS.strip()
