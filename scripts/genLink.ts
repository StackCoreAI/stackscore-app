// scripts/genLink.ts

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHORT_IO_API_KEY = process.env.SHORT_IO_API_KEY;
const DOMAIN = 'link.stackscore.ai';

if (!SHORT_IO_API_KEY) {
  throw new Error('❌ SHORT_IO_API_KEY not set in .env file');
}

interface LinkConfig {
  originalURL: string;
  path: string;
  title: string;
  expirationHours?: number;
  expirationURL?: string;
  tags?: string[];
}

const generateExpirationDate = (hoursFromNow: number): string => {
  const now = new Date();
  now.setHours(now.getHours() + hoursFromNow);
  return now.toISOString();
};

const createShortLink = async ({
  originalURL,
  path,
  title,
  expirationHours = 48,
  expirationURL = 'https://stackscore.ai/link-expired',
  tags = ['stackscore', 'gpt'],
}: LinkConfig) => {
  try {
    const response = await axios.post(
      'https://api.short.io/links',
      {
        originalURL,
        domain: DOMAIN,
        path,
        title,
        expirationDate: generateExpirationDate(expirationHours),
        expirationURL,
        tags,
      },
      {
        headers: {
          Authorization: SHORT_IO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Link created successfully:');
    console.log(`🔗 Short URL: ${response.data.shortURL}`);
    console.log(`📅 Expires at: ${response.data.expirationDate}`);
  } catch (error: any) {
    console.error('❌ Error creating short link:', error.response?.data || error.message);
  }
};

// === Run Example ===
createShortLink({
  originalURL: 'https://chat.openai.com/g/gpt-example-id',
  path: 'plan-a-july25',
  title: 'GPT Access – StackScore Plan A',
  tags: ['stackscore', 'plan-a', 'gpt'],
});
