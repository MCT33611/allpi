import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const dev = process.env.NODE_ENV === 'development';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: dev ? 'debug' : 'info',
  enableTracing: dev,
});
