import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ContactConfig } from "@/types/content";
import emailjs from "@emailjs/browser";
import { LoaderCircle, Mail, Send, MessageSquare, Info } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface ContactPageProps {
  config: ContactConfig;
}

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialFormValues: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactPage({ config }: ContactPageProps) {
  const [values, setValues] = useState<ContactFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const emailReady = useMemo(() => Boolean(serviceID && templateID && publicKey), [publicKey, serviceID, templateID]);

  const handleChange = (field: keyof ContactFormValues, value: string) => {
    setValues(curr => ({ ...curr, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const { name, email, subject, message } = values;
    if (!name || !email || !subject || !message) {
      setErrorMessage("Please complete all fields before sending.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!emailReady) {
      setErrorMessage("Email service is not configured yet. Please add EmailJS keys.");
      return;
    }

    setIsSubmitting(true);
    try {
      await emailjs.send(serviceID, templateID, { name, email, subject, message, user_name: name, user_email: email, submitted_at: new Date().toISOString() }, { publicKey });
      setSuccessMessage("Message sent successfully. We will get back to you soon, in sha Allah.");
      setValues(initialFormValues);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-grid reveal">
      <section className="panel p-8 md:p-12 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
          <Mail size={14} />
          Get In Touch
        </div>
        <h1 className="font-bebas text-5xl md:text-7xl text-white tracking-wide leading-none">{config.title}</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">{config.description}</p>
        
        <div className="flex items-center gap-3 mt-4">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold">
            {config.statusText}
          </Badge>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Average response: 24-48h</span>
        </div>
      </section>

      <section className="panel p-6 md:p-10 flex flex-col gap-10">
        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
          <MessageSquare size={20} className="text-primary" />
          <h2 className="font-bebas text-2xl tracking-wide text-white uppercase">Inquiry Form</h2>
        </div>

        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Your Name</label>
              <Input
                className="h-12 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 text-white transition-all"
                value={values.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Full Name"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Email Address</label>
              <Input
                className="h-12 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 text-white transition-all"
                type="email"
                value={values.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Subject</label>
            <Input
              className="h-12 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 text-white transition-all"
              value={values.subject}
              onChange={e => handleChange("subject", e.target.value)}
              placeholder="How can we help you?"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Message</label>
            <Textarea
              className="min-h-[200px] rounded-2xl border-white/10 bg-white/5 focus:border-primary/50 text-white transition-all p-4 leading-relaxed"
              value={values.message}
              onChange={e => handleChange("message", e.target.value)}
              placeholder="Share your thoughts, questions or feedback..."
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Info size={14} className="text-primary/60" />
              <p className="text-[10px] uppercase font-bold tracking-widest">Secured by industry standard encryption</p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto rounded-full bg-primary text-primary-foreground font-bold px-10 hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
              disabled={isSubmitting || !emailReady}
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
              {isSubmitting ? "Sending Inquiry..." : "Submit Message"}
            </Button>
          </div>

          {!emailReady && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center animate-pulse">
              System Configuration Required: VITE_EMAILJS keys missing in environment.
            </div>
          )}
          {errorMessage && <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center">{errorMessage}</div>}
          {successMessage && <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold text-center">{successMessage}</div>}
        </form>
      </section>
    </main>
  );
}
