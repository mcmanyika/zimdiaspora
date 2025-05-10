import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      email,
      investorName,
      proposalTitle,
      amount,
      fundingPercentage,
      totalRaised,
      targetAmount
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Send email using Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-investment-email', {
      body: {
        email,
        investorName,
        proposalTitle,
        amount,
        fundingPercentage,
        totalRaised,
        targetAmount
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send confirmation email' });
    }

    return res.status(200).json({ message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error in send-investment-confirmation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 