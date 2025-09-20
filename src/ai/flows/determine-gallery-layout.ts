
'use server';
/**
 * @fileOverview This file defines a Genkit flow to determine the best layout strategy
 * for a collection of gallery items (images or folders).
 *
 * - determineGalleryLayout - A function that analyzes a list of items and suggests a layout for each.
 */

import {ai} from '@/ai/genkit';
import {
  DetermineGalleryLayoutInputSchema,
  DetermineGalleryLayoutOutputSchema,
  type DetermineGalleryLayoutInput,
  type DetermineGalleryLayoutOutput,
} from './gallery-layout-types';

// Exported function that clients will call
export async function determineGalleryLayout(
  input: DetermineGalleryLayoutInput
): Promise<DetermineGalleryLayoutOutput> {
  const result = await determineGalleryLayoutFlow(input);
  return result;
}

const galleryLayoutPrompt = ai.definePrompt({
  name: 'galleryLayoutPrompt',
  input: {schema: DetermineGalleryLayoutInputSchema},
  output: {schema: DetermineGalleryLayoutOutputSchema},
  prompt: `You are an expert in UI design, specializing in photo galleries.
    Based on the provided list of items (images and folders), determine the optimal layout for each.

    Rules:
    - A single image should always have a 'vertical' layout.
    - A folder containing images should generally have a 'horizontal' layout to encourage browsing.

    Here are the items:
    {{#each items}}
    - ID: {{id}}, Type: {{type}}, Name: {{name}}, Path: {{path}}
    {{/each}}

    Please provide the layout for each item.
    `,
});

const determineGalleryLayoutFlow = ai.defineFlow(
  {
    name: 'determineGalleryLayoutFlow',
    inputSchema: DetermineGalleryLayoutInputSchema,
    outputSchema: DetermineGalleryLayoutOutputSchema,
  },
  async input => {
    // If there are no items, return an empty array.
    if (input.items.length === 0) {
      return {
        itemsWithLayout: [],
      };
    }

    const {output} = await galleryLayoutPrompt(input);
    return output!;
  }
);
