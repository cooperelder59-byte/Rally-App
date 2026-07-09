import LegalLayout from './LegalLayout';

// Replace these before publishing:
const COMPANY_NAME = 'Rally';
const COMPANY_LEGAL_NAME = '[Rally Ltd — insert registered NZ company name]';
const NZBN = '[insert NZBN]';
const CONTACT_EMAIL = 'privacy@rallyapp.co.nz';
const LAST_UPDATED = '9 July 2026';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated={LAST_UPDATED}>
      <div className="legal-callout">
        <p>
          <strong>In short:</strong> Rally collects the information needed to run your team —
          accounts, rosters, schedules, messages, and performance notes. We don't sell your data,
          we don't show ads, and we give coaches and admins tools to keep young players' information
          limited to the people who need it. This policy explains the details required under the
          Privacy Act 2020.
        </p>
      </div>

      <ul className="legal-toc">
        <li><a href="#who-we-are">1. Who we are</a></li>
        <li><a href="#what-we-collect">2. What we collect</a></li>
        <li><a href="#children">3. Children and young people</a></li>
        <li><a href="#how-we-use">4. How we use it</a></li>
        <li><a href="#sharing">5. Sharing and disclosure</a></li>
        <li><a href="#overseas">6. Overseas storage</a></li>
        <li><a href="#security">7. Security</a></li>
        <li><a href="#retention">8. Retention</a></li>
        <li><a href="#rights">9. Your rights</a></li>
        <li><a href="#cookies">10. Cookies</a></li>
        <li><a href="#changes">11. Changes to this policy</a></li>
        <li><a href="#contact">12. Contact us</a></li>
      </ul>

      <h2 id="who-we-are">1. Who we are</h2>
      <p>
        {COMPANY_NAME} is a team communication, scheduling, and performance-tracking platform for
        school sports teams, clubs, and similar groups, operated by {COMPANY_LEGAL_NAME}
        {NZBN !== '[insert NZBN]' && <> (NZBN {NZBN})</>}, based in New Zealand. This policy explains
        how we collect, use, store, and disclose personal information in connection with the Rally
        app and website (the &ldquo;Service&rdquo;), and applies to coaches, managers, players,
        parents/guardians, school administrators, and anyone else who uses Rally.
      </p>
      <p>
        We handle personal information in accordance with the Privacy Act 2020 and the 13
        Information Privacy Principles (IPPs) it sets out.
      </p>

      <h2 id="what-we-collect">2. What we collect</h2>
      <p>The information we collect depends on how you use Rally, and typically includes:</p>
      <ul>
        <li><strong>Account information:</strong> name, email address, password, and profile photo.</li>
        <li><strong>Team and roster information:</strong> team names, positions, contact details, and membership entered by coaches, managers, or admins.</li>
        <li><strong>Communications:</strong> messages, announcements, and posts sent through Rally.</li>
        <li><strong>Scheduling information:</strong> events, locations, and calendar entries you create or that are shared with you.</li>
        <li><strong>Performance data:</strong> session notes, statistics, and progress records entered by coaches.</li>
        <li><strong>Usage information:</strong> device type, log data, and general usage of the Service, collected automatically to keep Rally working reliably.</li>
      </ul>
      <p>
        Where possible, we collect information directly from you. In some cases &mdash; for example,
        when a coach or school admin adds a player to a roster &mdash; information about you may be
        collected from a third party acting on your team's behalf, rather than directly from you.
      </p>

      <h2 id="children">3. Children and young people</h2>
      <p>
        Rally is built for school and youth sports teams, which means some of the people whose
        information appears on the platform &mdash; players in junior teams, for instance &mdash;
        are children or young people rather than the account holder themselves.
      </p>
      <ul>
        <li>
          Player information for junior teams is generally entered and managed by a coach, team
          manager, or school on behalf of the young person, acting with the authority of the school,
          club, or a parent/guardian.
        </li>
        <li>
          We ask coaches and admins to limit what they enter about young players to what's genuinely
          needed to run the team &mdash; name, position, and relevant contact or performance details
          &mdash; and not to share it beyond the team.
        </li>
        <li>
          Parents and guardians can ask their child's coach, team admin, or school to access, correct,
          or remove their child's information, or can contact us directly using the details in
          section 12 and we will work with the relevant team admin to action the request.
        </li>
        <li>
          We do not use children's information for advertising, marketing, or profiling, and we do
          not sell it.
        </li>
      </ul>

      <h2 id="how-we-use">4. How we use it</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>provide, operate, and maintain the Service, including messaging, scheduling, rosters, and performance tracking;</li>
        <li>authenticate accounts and keep the Service secure;</li>
        <li>send service-related notifications (e.g. new messages, upcoming events);</li>
        <li>respond to support requests;</li>
        <li>understand how Rally is used so we can improve it; and</li>
        <li>meet our legal obligations.</li>
      </ul>
      <p>We do not use personal information to serve advertising, and we do not sell personal information to third parties.</p>

      <h2 id="sharing">5. Sharing and disclosure</h2>
      <p>We disclose personal information only:</p>
      <ul>
        <li><strong>Within a team:</strong> information you post or that a coach/admin enters (e.g. rosters, announcements) is visible to other members of the relevant team, as intended by the Service's design.</li>
        <li><strong>To service providers:</strong> we use third-party providers (e.g. cloud hosting, email delivery) to operate Rally, bound by contractual confidentiality and security obligations.</li>
        <li><strong>For legal reasons:</strong> where required by law, regulation, or a valid legal process, or to protect the rights, safety, or property of Rally, our users, or others.</li>
        <li><strong>With your consent:</strong> in any other case where you've agreed to the disclosure.</li>
      </ul>
      <p>We do not sell personal information or share it with third parties for their own marketing purposes.</p>

      <h2 id="overseas">6. Overseas storage</h2>
      <p>
        Some of our service providers (such as cloud infrastructure) may store or process
        information outside New Zealand, including in jurisdictions with different privacy laws. In
        line with Information Privacy Principle 12, where we disclose personal information overseas
        we take reasonable steps to ensure it is protected by comparable safeguards, such as
        contractual commitments from our providers, before doing so.
      </p>

      <h2 id="security">7. Security</h2>
      <p>
        We use reasonable technical and organisational measures &mdash; including encryption in
        transit, access controls, and regular review of our practices &mdash; to protect personal
        information from loss, unauthorised access, use, modification, or disclosure. No system is
        completely secure, and we encourage you to use a strong, unique password and to let us know
        promptly at {CONTACT_EMAIL} if you suspect unauthorised access to your account.
      </p>

      <h2 id="retention">8. Retention</h2>
      <p>
        We keep personal information for as long as your account or team is active, and for a
        reasonable period afterwards to meet legal, accounting, or dispute-resolution needs. Team
        admins can remove members or delete rosters at any time; you can request deletion of your
        account by contacting us (see section 12).
      </p>

      <h2 id="rights">9. Your rights</h2>
      <p>
        Under the Privacy Act 2020, you have the right to ask for access to the personal information
        we hold about you and to ask us to correct it if it's wrong. To make a request:
      </p>
      <ul>
        <li>contact your team's coach or admin if the information was entered by them and relates only to that team; or</li>
        <li>email us at {CONTACT_EMAIL}, and we will respond within the timeframes required by the Privacy Act (generally 20 working days).</li>
      </ul>
      <p>
        If you're not satisfied with our response, you can complain to the Office of the Privacy
        Commissioner at{' '}
        <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer">
          privacy.org.nz
        </a>.
      </p>

      <h2 id="cookies">10. Cookies</h2>
      <p>
        We use essential cookies and similar technologies to keep you signed in and to remember your
        preferences. We don't use cookies for advertising or cross-site tracking. Most browsers let
        you control or clear cookies through their settings.
      </p>

      <h2 id="changes">11. Changes to this policy</h2>
      <p>
        We may update this policy from time to time to reflect changes to the Service or our legal
        obligations. If we make material changes, we'll let you know through the Service or by email
        before they take effect. The &ldquo;Last updated&rdquo; date at the top shows when this
        version came into force.
      </p>

      <h2 id="contact">12. Contact us</h2>
      <p>
        If you have questions about this policy or how we handle personal information, contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  );
}