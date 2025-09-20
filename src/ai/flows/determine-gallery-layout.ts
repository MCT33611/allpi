
'use server';
/**
 * @fileOverview This file defines a Genkit flow to determine the best layout strategy
 * for a collection of gallery items (images or folders).
 *
 * - determineGalleryLayout - A function that analyzes a list of items and suggests a layout for each.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Schemas and Types (defined in-file, not exported)
const GalleryItemInputSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'folder']),
  name: z.string(),
  path: z.string(),
});

const DetermineGalleryLayoutInputSchema = z.object({
  items: z
    .array(GalleryItemInputSchema)
    .describe('An array of gallery items to be processed.'),
});
type DetermineGalleryLayoutInput = z.infer<
  typeof DetermineGalleryLayoutInputSchema
>;

const GalleryItemLayoutSchema = z.object({
  id: z.string().describe('The unique identifier for the item.'),
  layout: z
    .enum(['horizontal', 'vertical'])
    .describe("The suggested layout strategy ('horizontal' or 'vertical')."),
});

const DetermineGalleryLayoutOutputSchema = z.object({
  itemsWithLayout: z
    .array(GalleryItemLayoutSchema)
    .describe('An array of items with their determined layout.'),
});
type DetermineGalleryLayoutOutput = z.infer<
  typeof DetermineGalleryLayoutOutputSchema
>;


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

    Your task is to analyze the following list of items and assign a layout of either 'horizontal' or 'vertical' to each one.

    Follow these rules strictly:
    1.  If the item's type is 'image', you MUST assign it a 'vertical' layout.
    2.  If the item's type is 'folder', you MUST assign it a 'horizontal' layout.
    3.  You must provide a layout for every single item in the input array. Do not skip any.

    Here is the list of items to process:
    {{#each items}}
    - ID: {{this.id}}, Type: {{this.type}}, Name: {{this.name}}, Path: {{this.path}}
    {{/each}}

    Please provide the layout for each item in the specified JSON output format.
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
