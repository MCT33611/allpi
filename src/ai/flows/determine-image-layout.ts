'use server';

/**
 * @fileOverview This file defines a Genkit flow to determine the best layout strategy (horizontal or vertical) for images or folders.
 *
 * - determineImageLayout - A function that analyzes image/folder properties and suggests a layout strategy.
 * - DetermineImageLayoutInput - The input type for the determineImageLayout function.
 * - DetermineImageLayoutOutput - The return type for the determineImageLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineImageLayoutInputSchema = z.object({
  location: z.string().describe('The location (path) of the image or folder.'),
  extension: z.string().describe('The file extension of the image (e.g., jpg, png).'),
  isFolder: z.boolean().describe('Whether the item is a folder or a single image.'),
  imageCount: z.number().optional().describe('The number of images in the folder, if applicable.'),
  averageImageWidth: z.number().optional().describe('The average width of images in the folder, if applicable.'),
  averageImageHeight: z.number().optional().describe('The average height of images in the folder, if applicable.'),
});
export type DetermineImageLayoutInput = z.infer<typeof DetermineImageLayoutInputSchema>;

const DetermineImageLayoutOutputSchema = z.object({
  layoutStrategy: z
    .enum(['horizontal', 'vertical'])
    .describe('The suggested layout strategy for the image(s).'),
  reason: z.string().describe('The reasoning behind the layout strategy suggestion.'),
});
export type DetermineImageLayoutOutput = z.infer<typeof DetermineImageLayoutOutputSchema>;

export async function determineImageLayout(input: DetermineImageLayoutInput): Promise<DetermineImageLayoutOutput> {
  return determineImageLayoutFlow(input);
}

const determineImageLayoutPrompt = ai.definePrompt({
  name: 'determineImageLayoutPrompt',
  input: {schema: DetermineImageLayoutInputSchema},
  output: {schema: DetermineImageLayoutOutputSchema},
  prompt: `You are an expert in UI design, tasked with determining the best layout strategy for an image gallery.

  Given the following information about an image or a folder of images, suggest whether a 'horizontal' or 'vertical' layout would be more appropriate.

  Location: {{{location}}}
  Extension: {{{extension}}}
  Is Folder: {{{isFolder}}}
  {{#if isFolder}}
  Image Count: {{{imageCount}}}
  Average Image Width: {{{averageImageWidth}}}
  Average Image Height: {{{averageImageHeight}}}
  {{/if}}

  Consider the following factors:
  - Folders should generally use horizontal layouts to allow browsing through the contents.
  - Single images should generally use vertical layouts.
  - If a folder contains images with a very wide average width compared to their average height, a horizontal layout is preferred.

  Provide a brief reason for your suggestion.
  Output the result as a JSON object with 'layoutStrategy' (either 'horizontal' or 'vertical') and 'reason' fields.
  `,
});

const determineImageLayoutFlow = ai.defineFlow(
  {
    name: 'determineImageLayoutFlow',
    inputSchema: DetermineImageLayoutInputSchema,
    outputSchema: DetermineImageLayoutOutputSchema,
  },
  async input => {
    const {output} = await determineImageLayoutPrompt(input);
    return output!;
  }
);
