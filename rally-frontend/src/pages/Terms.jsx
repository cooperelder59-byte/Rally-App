import LegalLayout from './LegalLayout';

// Replace these before publishing:
const COMPANY_NAME = 'Rally';
const COMPANY_LEGAL_NAME = '[Rally Ltd — insert registered NZ company name]';
const NZBN = '[insert NZBN]';
const CONTACT_EMAIL = 'rallyoffical387@gmail.com';
const LAST_UPDATED = '9 July 2026';

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated={LAST_UPDATED}>
      <div className="legal-callout">
        <p>
          <strong>In short:</strong> Rally is provided for organising school sports teams and
          clubs. Keep your account secure, only post content you have the right to share, treat
          other members with respect, and know that content about players is entered and managed by
          coaches/admins on the team's behalf. These terms are governed by New Zealand law.
        </p>
      </div>

      <ul className="legal-toc">
        <li><a href="#acceptance">1. Acceptance of these terms</a></li>
        <li><a href="#service">2. The Service</a></li>
        <li><a href="#accounts">3. Accounts and eligibility</a></li>
        <li><a href="#teams">4. Teams, admins, and player information</a></li>
        <li><a href="#acceptable-use">5. Acceptable use</a></li>
        <li><a href="#content">6. Your content</a></li>
        <li><a href="#ip">7. Our intellectual property</a></li>
        <li><a href="#suspension">8. Suspension and termination</a></li>
        <li><a href="#disclaimers">9. Disclaimers</a></li>
        <li><a href="#liability">10. Limitation of liability</a></li>
        <li><a href="#consumer-rights">11. Consumer rights</a></li>
        <li><a href="#changes">12. Changes to these terms</a></li>
        <li><a href="#law">13. Governing law</a></li>
        <li><a href="#contact">14. Contact us</a></li>
      </ul>

      <h2 id="acceptance">1. Acceptance of these terms</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and{' '}
        {COMPANY_LEGAL_NAME}{NZBN !== '[insert NZBN]' && <> (NZBN {NZBN})</>}, trading as{' '}
        {COMPANY_NAME} (&ldquo;{COMPANY_NAME}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By
        creating an account or otherwise using the Rally app or website (the
        &ldquo;Service&rdquo;), you agree to these Terms. If you're using Rally on behalf of a
        school, club, or team, you're confirming you have the authority to agree to these Terms on
        its behalf.
      </p>

      <h2 id="service">2. The Service</h2>
      <p>
        Rally provides tools for team communication, scheduling, rosters, and performance tracking
        for school sports teams, clubs, and similar groups. We may add, change, or remove features
        from time to time, and we'll try to give reasonable notice of any change that materially
        reduces the Service's functionality.
      </p>

      <h2 id="accounts">3. Accounts and eligibility</h2>
      <ul>
        <li>You need to create an account to use most of Rally, and you're responsible for keeping your login details confidential and for all activity under your account.</li>
        <li>You must provide accurate information when creating an account and keep it up to date.</li>
        <li>Rally accounts are intended for coaches, managers, players, parents/guardians, and school staff aged 16 or over. Where a player is younger than this, their profile and information should be created and managed by a parent, guardian, coach, or school admin rather than the child holding their own account.</li>
        <li>You must let us know promptly if you become aware of any unauthorised use of your account.</li>
      </ul>

      <h2 id="teams">4. Teams, admins, and player information</h2>
      <ul>
        <li>Coaches, managers, and school admins (&ldquo;Team Admins&rdquo;) who set up a team on Rally are responsible for the accuracy of the roster, schedule, and other information they add, and for having the appropriate authority and consent (including from parents/guardians, where relevant) to add information about players.</li>
        <li>Team Admins control who is invited to and removed from a team, and are responsible for managing membership and access appropriately.</li>
        <li>We rely on Team Admins to only enter information about players that is necessary for running the team, in line with our Privacy Policy.</li>
      </ul>

      <h2 id="acceptable-use">5. Acceptable use</h2>
      <p>When using Rally, you agree not to:</p>
      <ul>
        <li>post or share content that is unlawful, harassing, abusive, defamatory, or that violates another person's privacy;</li>
        <li>impersonate another person or misrepresent your affiliation with a team or school;</li>
        <li>upload viruses or other malicious code, or attempt to interfere with the Service's operation or security;</li>
        <li>access or attempt to access another user's account without authorisation;</li>
        <li>use the Service to send unsolicited advertising or spam; or</li>
        <li>use the Service in any way that breaches applicable law.</li>
      </ul>
      <p>We may remove content or suspend access that we reasonably believe breaches this section.</p>

      <h2 id="content">6. Your content</h2>
      <p>
        You retain ownership of the messages, photos, notes, and other content you post to Rally
        (&ldquo;Your Content&rdquo;). By posting Your Content, you grant {COMPANY_NAME} a
        non-exclusive, worldwide licence to host, store, reproduce, and display it solely for the
        purpose of operating and providing the Service to you and your team. This licence ends when
        Your Content is deleted from Rally, except for backup copies that are removed in the
        ordinary course of our data retention practices.
      </p>
      <p>
        You're responsible for Your Content and confirm you have the necessary rights and, where it
        relates to another person (e.g. a photo of a player), an appropriate basis to share it
        through the Service.
      </p>

      <h2 id="ip">7. Our intellectual property</h2>
      <p>
        Rally's software, branding, and design are owned by {COMPANY_LEGAL_NAME} or our licensors
        and are protected by intellectual property laws. Other than the licence to use the Service
        as intended, these Terms don't grant you any rights to our trademarks, logos, or underlying
        technology.
      </p>

      <h2 id="suspension">8. Suspension and termination</h2>
      <ul>
        <li>You can stop using Rally and delete your account at any time.</li>
        <li>We may suspend or terminate your access if you materially breach these Terms, including the acceptable use rules in section 5, and the breach isn't fixed within a reasonable time of us telling you about it (or immediately, in cases of serious misuse or legal risk).</li>
        <li>On termination, your right to use the Service ends, though provisions of these Terms that by their nature should survive (e.g. sections 7, 9, 10, and 13) will continue to apply.</li>
      </ul>

      <h2 id="disclaimers">9. Disclaimers</h2>
      <p>
        The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To
        the maximum extent permitted by law, we exclude all warranties, whether express or implied,
        other than any rights you have under the Consumer Guarantees Act 1993 or the Fair Trading
        Act 1986 that cannot lawfully be excluded. We don't guarantee that the Service will be
        uninterrupted, error-free, or available at all times.
      </p>

      <h2 id="liability">10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {COMPANY_NAME} will not be liable for any indirect,
        incidental, or consequential loss (including loss of data or loss of opportunity) arising
        from your use of the Service. Nothing in these Terms limits liability that cannot lawfully
        be excluded or limited under New Zealand law.
      </p>

      <h2 id="consumer-rights">11. Consumer rights</h2>
      <p>
        If you're acquiring the Service as a &ldquo;consumer&rdquo; within the meaning of the
        Consumer Guarantees Act 1993, nothing in these Terms is intended to limit any rights you
        have under that Act. If you're acquiring the Service for the purposes of a business, to the
        extent permitted by law, the parties agree the Consumer Guarantees Act 1993 does not apply.
      </p>

      <h2 id="changes">12. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we'll give
        reasonable notice through the Service or by email before they take effect. Continuing to use
        Rally after changes take effect means you accept the updated Terms.
      </p>

      <h2 id="law">13. Governing law</h2>
      <p>
        These Terms are governed by the laws of New Zealand, and the parties submit to the exclusive
        jurisdiction of the courts of New Zealand.
      </p>

      <h2 id="contact">14. Contact us</h2>
      <p>
        Questions about these Terms can be sent to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}