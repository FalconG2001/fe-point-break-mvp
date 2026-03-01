import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Link from "next/link";

export const dynamic = "force-static";

export default function TermsPage() {
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
              Terms of Service
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Point Break Gamer Zone • Rajapalayam • Effective date:{" "}
              {effectiveDate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Also see{" "}
              <Box component="span" sx={{ fontWeight: 800 }}>
                <Link href="/privacy">Privacy Policy</Link>
              </Box>
              .
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Section title="1) Agreement">
              <P>
                By using this website or making a booking, you agree to these
                Terms. If you do not agree, do not use the site.
              </P>
            </Section>

            <Section title="2) What we provide">
              <P>
                We provide an online booking system to view available time
                slots, select consoles, and place a booking request.
              </P>
            </Section>

            <Section title="3) Booking rules">
              <UL
                items={[
                  "A booking is for the selected date, start time, and duration.",
                  "Availability is live and may change quickly.",
                  "We may reject or cancel a booking if the slot is no longer available, a system error occurs, or we suspect spam/fraud.",
                ]}
              />
            </Section>

            <Section title="4) Pricing rules">
              <UL
                items={[
                  "Prices depend on players, duration, and pricing type (Normal/Student).",
                  "Student pricing requires a valid school/college ID at the center.",
                  "If ID is not shown, Normal pricing will apply.",
                ]}
              />
            </Section>

            <Section title="5) Payments">
              <P>
                <B>No online payments:</B> This website does not collect
                payment. Payment is handled in person at the gaming center after
                the session.
              </P>
              <P sx={{ mt: 1 }}>
                We may record the amount paid and payment method for internal
                tracking (example: cash/UPI), but we do not store card or bank
                login details on this website.
              </P>
            </Section>

            <Section title="6) Cancellations and reschedules">
              <P>
                Contact us to cancel or reschedule: <B>+918825467462</B>.
              </P>
              <P sx={{ mt: 1 }}>
                Refunds (if any) depend on your situation and how close it is to
                the booking time. No-shows or very late arrivals may lose the
                booking.
              </P>
              <P sx={{ mt: 1 }}>
                If you want a strict policy, replace this section with your
                exact rules (example: “No cancellation within 1 hour”).
              </P>
            </Section>

            <Section title="7) Rules at the gaming center">
              <UL
                items={[
                  "Respect equipment (controllers, consoles, TVs).",
                  "No damage, abuse, theft, or illegal activity.",
                  "Follow staff instructions and time limits.",
                  "We can refuse service if rules are broken.",
                ]}
              />
            </Section>

            <Section title="8) WhatsApp messages (optional)">
              <P>
                If you opt in, we may send booking confirmations/updates through
                WhatsApp.
              </P>
              <UL
                items={[
                  "You can opt out anytime by replying STOP or contacting us.",
                  "Delivery is not guaranteed (network/device/WhatsApp rules).",
                  "You confirm you own/control the phone number you provided.",
                ]}
              />
            </Section>

            <Section title="9) Accuracy of info">
              <P>
                You must provide a correct name and phone number. If your info
                is wrong and we cannot reach you, we are not responsible.
              </P>
            </Section>

            <Section title="10) Limitations and disclaimers">
              <UL
                items={[
                  "The website is provided “as is”.",
                  "We do not guarantee it will be error-free or always available.",
                  "We are not responsible for losses caused by network issues, WhatsApp delivery failures, incorrect user input, or third-party outages.",
                ]}
              />
            </Section>

            <Section title="11) Liability limit">
              <P>
                To the maximum allowed by law, our total liability related to
                any booking is limited to the amount you paid for that booking.
              </P>
            </Section>

            <Section title="12) Governing law">
              <P>
                These Terms are governed by the laws of India. Any disputes will
                be handled in courts within/near <B>Rajapalayam</B>.
              </P>
            </Section>

            <Section title="13) Contact">
              <P>
                Email: <B>slicesharpy@gmail.com</B>
              </P>
              <P>
                Phone: <B>+918825467462</B>
              </P>
              <P>
                Address:{" "}
                <B>
                  Point break gamer zone, PSK Nagar Bus stop, Opposite to Ajanta
                  Sweets, Rajapalayam - 626117
                </B>
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
