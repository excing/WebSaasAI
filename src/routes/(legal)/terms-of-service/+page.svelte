<script lang="ts">
    import * as Card from "$lib/components/ui/card";
</script>

<div
    class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
>
    <div class="container mx-auto max-w-4xl px-4 py-16">
        <div class="mb-8">
            <a
                href="/"
                class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
                ← Back to home
            </a>
        </div>

        <Card.Root class="border-0 shadow-xl">
            <Card.Content class="p-8 md:p-12">
                <h1 class="mb-8 text-3xl font-bold md:text-4xl">
                    Terms of Service
                </h1>
                <p class="mb-8 text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div class="space-y-8 text-gray-700 dark:text-gray-300">
                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            1. Acceptance of Terms
                        </h2>
                        <p class="leading-relaxed">
                            By accessing and using SvelteKit Starter Kit
                            ('Service'), you accept and agree to be bound by the
                            terms and provisions of this agreement. If you do
                            not agree to abide by the above, please do not use
                            this Service.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            2. Description of Service
                        </h2>
                        <p class="leading-relaxed">
                            SvelteKit Starter Kit provides a platform for
                            building and deploying web applications. Our Service
                            includes tools for authentication, subscription
                            management, file uploads, and AI chat functionality.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            3. User Accounts
                        </h2>
                        <div class="space-y-3">
                            <p class="leading-relaxed">
                                To use certain features of the Service, you must
                                register for an account. When you register for
                                an account, you agree to:
                            </p>
                            <ul class="ml-4 list-inside list-disc space-y-1">
                                <li>
                                    Provide accurate, current, and complete
                                    information
                                </li>
                                <li>
                                    Maintain and update your information to keep
                                    it accurate and complete
                                </li>
                                <li>
                                    Maintain the security of your account
                                    credentials
                                </li>
                                <li>
                                    Accept responsibility for all activities
                                    that occur under your account
                                </li>
                                <li>
                                    Notify us immediately of any unauthorized
                                    use of your account
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            4. Subscription and Payment
                        </h2>
                        <div class="space-y-3">
                            <p class="leading-relaxed">
                                Some aspects of our Service are provided on a
                                subscription basis. By subscribing, you agree
                                to:
                            </p>
                            <ul class="ml-4 list-inside list-disc space-y-1">
                                <li>
                                    Pay all applicable fees as described in our
                                    pricing plans
                                </li>
                                <li>
                                    Provide current, complete, and accurate
                                    billing information
                                </li>
                                <li>
                                    Authorize us to charge your payment method
                                    on a recurring basis
                                </li>
                                <li>
                                    Be responsible for all charges incurred
                                    under your account
                                </li>
                            </ul>
                            <p class="mt-3 leading-relaxed">
                                Subscription fees are non-refundable except as
                                required by law. We reserve the right to change
                                our subscription plans or adjust pricing with 30
                                days' notice.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            5. User Responsibilities and Conduct
                        </h2>
                        <div class="space-y-3">
                            <p class="leading-relaxed">
                                You agree to use the Service only for lawful
                                purposes and in accordance with these Terms. You
                                agree not to:
                            </p>
                            <ul class="ml-4 list-inside list-disc space-y-1">
                                <li>
                                    Use the Service in any way that violates any
                                    applicable laws or regulations
                                </li>
                                <li>
                                    Create content that is false, misleading, or
                                    fraudulent
                                </li>
                                <li>
                                    Impersonate any person or entity or
                                    misrepresent your affiliation
                                </li>
                                <li>
                                    Upload or transmit viruses or any other type
                                    of malicious code
                                </li>
                                <li>
                                    Attempt to gain unauthorized access to any
                                    portion of the Service
                                </li>
                                <li>
                                    Interfere with or disrupt the Service or
                                    servers
                                </li>
                                <li>
                                    Use the Service to send spam or unsolicited
                                    communications
                                </li>
                                <li>Violate the privacy rights of others</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            6. Intellectual Property Rights
                        </h2>
                        <div class="space-y-3">
                            <h3 class="mb-2 text-lg font-medium">
                                Our Intellectual Property
                            </h3>
                            <p class="leading-relaxed">
                                The Service and its original content, features,
                                and functionality are owned by us and are
                                protected by international copyright, trademark,
                                patent, trade secret, and other intellectual
                                property laws.
                            </p>

                            <h3 class="mb-2 mt-4 text-lg font-medium">
                                Your Content
                            </h3>
                            <p class="leading-relaxed">
                                You retain ownership of any content you create
                                using our Service. By using our Service, you
                                grant us a worldwide, non-exclusive,
                                royalty-free license to use, reproduce, and
                                display your content solely for the purpose of
                                providing the Service to you.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            7. Disclaimers
                        </h2>
                        <div class="space-y-3">
                            <p class="font-medium uppercase leading-relaxed">
                                The Service is provided on an 'AS IS' and 'AS
                                AVAILABLE' basis without warranties of any kind,
                                either express or implied, including but not
                                limited to:
                            </p>
                            <ul class="ml-4 list-inside list-disc space-y-1">
                                <li>Warranties of merchantability</li>
                                <li>Fitness for a particular purpose</li>
                                <li>Non-infringement</li>
                                <li>
                                    That the Service will be uninterrupted or
                                    error-free
                                </li>
                                <li>That defects will be corrected</li>
                                <li>
                                    That the Service is free of viruses or
                                    harmful components
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            8. Limitation of Liability
                        </h2>
                        <p class="font-medium uppercase leading-relaxed">
                            To the maximum extent permitted by law, we shall not
                            be liable for any indirect, incidental, special,
                            consequential, or punitive damages, or any loss of
                            profits or revenues, whether incurred directly or
                            indirectly, or any loss of data, use, goodwill, or
                            other intangible losses resulting from your use of
                            the Service.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            9. Termination
                        </h2>
                        <p class="leading-relaxed">
                            We may terminate or suspend your account and bar
                            access to the Service immediately, without prior
                            notice or liability, under our sole discretion, for
                            any reason whatsoever, including without limitation
                            if you breach the Terms. Upon termination, your
                            right to use the Service will cease immediately.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            10. Governing Law
                        </h2>
                        <p class="leading-relaxed">
                            These Terms shall be governed and construed in
                            accordance with the laws of [Your Jurisdiction],
                            without regard to its conflict of law provisions.
                            Our failure to enforce any right or provision of
                            these Terms will not be considered a waiver of those
                            rights.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            11. Contact Information
                        </h2>
                        <p class="leading-relaxed">
                            If you have any questions about these Terms, please
                            contact us at:
                        </p>
                        <div class="mt-3 space-y-1">
                            <p>Email: legal@example.com</p>
                            <p>Address: [Your Company Address]</p>
                        </div>
                    </section>

                    <section
                        class="border-t border-gray-200 pt-8 dark:border-gray-700"
                    >
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            By using SvelteKit Starter Kit, you acknowledge that
                            you have read, understood, and agree to be bound by
                            these Terms of Service.
                        </p>
                    </section>
                </div>
            </Card.Content>
        </Card.Root>
    </div>
</div>
