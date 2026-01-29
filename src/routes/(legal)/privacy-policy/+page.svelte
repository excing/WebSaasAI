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
                    Privacy Policy
                </h1>
                <p class="mb-8 text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div class="space-y-8 text-gray-700 dark:text-gray-300">
                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            1. Introduction
                        </h2>
                        <p class="leading-relaxed">
                            Welcome to SvelteKit Starter Kit ('we,' 'our,' or
                            'us'). We are committed to protecting your personal
                            information and your right to privacy. This Privacy
                            Policy explains how we collect, use, disclose, and
                            safeguard your information when you use our service.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            2. Information We Collect
                        </h2>
                        <div class="space-y-4">
                            <div>
                                <h3 class="mb-2 text-lg font-medium">
                                    Personal Information
                                </h3>
                                <p class="leading-relaxed">
                                    When you register for an account, we
                                    collect:
                                </p>
                                <ul
                                    class="ml-4 mt-2 list-inside list-disc space-y-1"
                                >
                                    <li>Name</li>
                                    <li>Email address</li>
                                    <li>
                                        Google account information (when using
                                        Google Sign-In)
                                    </li>
                                    <li>Organization details</li>
                                </ul>
                            </div>

                            <div>
                                <h3 class="mb-2 text-lg font-medium">
                                    Automatically Collected Information
                                </h3>
                                <p class="leading-relaxed">
                                    We automatically collect certain information
                                    when you use our service:
                                </p>
                                <ul
                                    class="ml-4 mt-2 list-inside list-disc space-y-1"
                                >
                                    <li>IP address</li>
                                    <li>Browser type and version</li>
                                    <li>Device information</li>
                                    <li>Usage data and analytics</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            3. How We Use Your Information
                        </h2>
                        <p class="mb-3 leading-relaxed">
                            We use your information to:
                        </p>
                        <ul class="ml-4 list-inside list-disc space-y-1">
                            <li>Provide and maintain our service</li>
                            <li>Create and manage your account</li>
                            <li>
                                Send you important updates and notifications
                            </li>
                            <li>
                                Respond to your inquiries and support requests
                            </li>
                            <li>Monitor and analyze usage patterns</li>
                            <li>
                                Improve our service and develop new features
                            </li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            4. Data Sharing and Disclosure
                        </h2>
                        <p class="mb-3 leading-relaxed">
                            We may share your information in the following
                            situations:
                        </p>
                        <ul class="ml-4 list-inside list-disc space-y-1">
                            <li>
                                <strong>With your consent:</strong> We may share
                                your information for any purpose with your explicit
                                consent
                            </li>
                            <li>
                                <strong>Service providers:</strong> We share data
                                with third-party vendors who assist in providing
                                our services
                            </li>
                            <li>
                                <strong>Legal requirements:</strong> We may disclose
                                information if required by law or valid legal process
                            </li>
                            <li>
                                <strong>Business transfers:</strong> In connection
                                with any merger, sale, or acquisition
                            </li>
                            <li>
                                <strong>Protection of rights:</strong> To protect
                                our rights, privacy, safety, or property
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            5. Third-Party Services
                        </h2>
                        <p class="leading-relaxed">
                            We use the following third-party services that may
                            collect information:
                        </p>
                        <ul class="ml-4 mt-2 list-inside list-disc space-y-1">
                            <li>
                                <strong>Google Sign-In:</strong> For authentication
                                services
                            </li>
                            <li>
                                <strong>Payment processors:</strong> For handling
                                subscription payments
                            </li>
                            <li>
                                <strong>Analytics services:</strong> To understand
                                service usage
                            </li>
                        </ul>
                        <p class="mt-3 leading-relaxed">
                            These services have their own privacy policies
                            governing the use of your information.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            6. Data Security
                        </h2>
                        <p class="leading-relaxed">
                            We implement appropriate technical and
                            organizational security measures to protect your
                            personal information. However, no method of
                            transmission over the Internet or electronic storage
                            is 100% secure, and we cannot guarantee absolute
                            security.
                        </p>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            7. Your Rights
                        </h2>
                        <p class="mb-3 leading-relaxed">
                            Depending on your location, you may have the
                            following rights:
                        </p>
                        <ul class="ml-4 list-inside list-disc space-y-1">
                            <li>
                                <strong>Access:</strong> Request access to your personal
                                information
                            </li>
                            <li>
                                <strong>Correction:</strong> Request correction of
                                inaccurate information
                            </li>
                            <li>
                                <strong>Deletion:</strong> Request deletion of your
                                personal information
                            </li>
                            <li>
                                <strong>Portability:</strong> Request a copy of your
                                data in a portable format
                            </li>
                            <li>
                                <strong>Objection:</strong> Object to certain processing
                                of your information
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2
                            class="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            8. Contact Us
                        </h2>
                        <p class="leading-relaxed">
                            If you have any questions about this Privacy Policy
                            or our data practices, please contact us at:
                        </p>
                        <div class="mt-3 space-y-1">
                            <p>Email: privacy@example.com</p>
                            <p>Address: [Your Company Address]</p>
                        </div>
                    </section>
                </div>
            </Card.Content>
        </Card.Root>
    </div>
</div>
