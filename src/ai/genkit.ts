import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {dev} from 'zod';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: dev ? 'debug' : 'info',
  enableTracing: dev,
});
