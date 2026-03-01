import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Link from "next/link";

export const dynamic = "force-static";

export default function PrivacyPage() {
  const effectiveDate = new Date().toISOString().slice(0, 10);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={900}>
              Privacy Policy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Point Break Gamer Zone • Rajapalayam • Effective date:{" "}
              {effectiveDate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Also see{" "}
              <Box component="span" sx={{ fontWeight: 800 }}>
                <Link href="/terms">Terms of Service</Link>
              </Box>
              .
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Section title="1) Who we are">
              <P>
                This website and booking system is run by{" "}
                <B>Point Break Gamer Zone</B> in <B>Rajapalayam</B> (“we”,
                “us”).
              </P>
              <P>
                Contact: <B>slicesharpy@gmail.com</B> • <B>+918825467462</B>
              </P>
              <P>
                Address:{" "}
                <B>
                  Point break gamer zone, PSK Nagar Bus stop, Opposite to Ajanta
                  Sweets, Rajapalayam - 626117
                </B>
              </P>
            </Section>

            <Section title="2) What we collect">
              <P>When you use our booking site, we may collect:</P>

              <UL
                items={[
                  "Your name and phone number",
                  "Booking date, time slot, consoles selected, number of players, and duration",
                  "Pricing type (Normal / Student)",
                ]}
              />

              <P sx={{ mt: 1.5 }}>
                <B>No online payments:</B> We do not take card/UPI payments on
                this website. Payment is handled in person at the gaming center
                after the session.
              </P>

              <P sx={{ mt: 1.5 }}>If you choose WhatsApp updates, we store:</P>
              <UL
                items={[
                  "That you opted in (yes/no)",
                  "The time you opted in",
                  "The phone number you asked us to message",
                ]}
              />

              <P sx={{ mt: 1.5 }}>
                We may also collect basic technical info for security and
                debugging (example: IP address, device type, browser type).
              </P>
            </Section>

            <Section title="3) Why we collect it">
              <UL
                items={[
                  "To create and manage your booking",
                  "To prevent double bookings and slot conflicts",
                  "To contact you if there is a booking issue",
                  "To send booking updates on WhatsApp if you opt in",
                  "To reduce abuse (spam/fake bookings) and improve reliability",
                ]}
              />
            </Section>

            <Section title="4) WhatsApp messages (Meta)">
              <P>
                If you opt in, we may send booking updates through WhatsApp
                using the WhatsApp Business Platform (Meta).
              </P>
              <UL
                items={[
                  "You can opt out anytime by replying STOP or contacting us",
                  "Message delivery is not guaranteed (network/device/WhatsApp rules)",
                ]}
              />
            </Section>

            <Section title="5) How we share data">
              <P>We do not sell your personal data.</P>
              <P>We may share limited data only when needed:</P>
              <UL
                items={[
                  "Meta/WhatsApp (to deliver your WhatsApp message if you opt in)",
                  "Hosting/database providers (to run the site)",
                  "Law enforcement/legal (only if required by law)",
                ]}
              />
            </Section>

            <Section title="6) Student pricing and ID">
              <P>
                If you select Student pricing, you may be asked to show a valid
                school/college ID at the center. If you cannot show it, Normal
                pricing will apply.
              </P>
              <P>
                We do not need to keep a copy of your ID. If we ever need it for
                a specific reason, we will tell you first.
              </P>
            </Section>

            <Section title="7) Data retention">
              <P>
                We keep booking records as long as needed to run the system and
                handle disputes. We delete or anonymize data when it is no
                longer needed.
              </P>
            </Section>

            <Section title="8) Your choices">
              <P>You can ask us to:</P>
              <UL
                items={[
                  "Show what data we have about you",
                  "Correct your details",
                  "Delete your data (unless we must keep it for legal reasons)",
                  "Stop WhatsApp messages (opt out)",
                ]}
              />
              <P sx={{ mt: 1.5 }}>
                Contact: <B>slicesharpy@gmail.com</B> with your phone number and
                booking date/time.
              </P>
            </Section>

            <Section title="9) Security">
              <P>
                We use reasonable security steps, but no online system is 100%
                secure. Please use the site at your own risk.
              </P>
            </Section>

            <Section title="10) Changes to this policy">
              <P>
                We may update this policy. The latest version will always be on
                this page with the effective date.
              </P>
            </Section>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6" fontWeight={900}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function P({ children, sx }: { children: React.ReactNode; sx?: any }) {
  return (
    <Typography variant="body2" color="text.primary" sx={sx}>
      {children}
    </Typography>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ fontWeight: 900 }}>
      {children}
    </Box>
  );
}

function UL({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {items.map((t) => (
        <Box component="li" key={t} sx={{ mb: 0.75 }}>
          <Typography variant="body2" color="text.primary">
            {t}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
