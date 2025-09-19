
'use server';
/**
 * @fileOverview This file defines a Genkit flow to determine the best layout strategy
 * for a collection of gallery items (images or folders).
 *
 * - determineGalleryLayout - A function that analyzes a list of items and suggests a layout for each.
 * - DetermineGalleryLayoutInput - The input type for the determineGalleryLayout function.
 * - DetermineGalleryLayoutOutput - The return type for the determineGalleryLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Base schema for an item (image or folder) without layout
const GalleryItemInputSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'folder']),
  name: z.string(),
  path: z.string(),
});

// Input for the main flow
export const DetermineGalleryLayoutInputSchema = z.object({
  items: z
    .array(GalleryItemInputSchema)
    .describe('An array of gallery items to be processed.'),
});
export type DetermineGalleryLayoutInput = z.infer<
  typeof DetermineGalleryLayoutInputSchema
>;

// Schema for an item with the decided layout
const GalleryItemLayoutSchema = z.object({
  id: z.string().describe('The unique identifier for the item.'),
  layout: z
    .enum(['horizontal', 'vertical'])
    .describe("The suggested layout strategy ('horizontal' or 'vertical')."),
});

// Output for the main flow
export const DetermineGalleryLayoutOutputSchema = z.object({
  itemsWithLayout: z
    .array(GalleryItemLayoutSchema)
    .describe('An array of items with their determined layout.'),
});
export type DetermineGalleryLayoutOutput = z.infer<
  typeof DetermineGalleryLayoutOutputSchema
>;

// Exported function that clients will call
export async function determineGalleryLayout(
  input: DetermineGalleryLayoutInput
): Promise<{itemsWithLayout: any[]}> {
  const result = await determineGalleryLayoutFlow(input);

  const layoutMap = new Map(
    result.itemsWithLayout.map(item => [item.id, item.layout])
  );

  const itemsWithLayout = input.items.map((item: any) => ({
    ...item,
    layout: layoutMap.get(item.id) || getDefaultLayout(item),
  }));

  return {itemsWithLayout};
}

function getDefaultLayout(item: {type: 'image' | 'folder'}) {
  return item.type === 'folder' ? 'horizontal' : 'vertical';
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
    const {output} = await galleryLayoutPrompt(input);
    return output!;
  }
);
