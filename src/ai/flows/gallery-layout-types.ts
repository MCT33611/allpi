
'use server';
/**
 * @fileOverview This file defines the types and schemas for the gallery layout flow.
 *
 * - DetermineGalleryLayoutInputSchema - Zod schema for the input of the determineGalleryLayout flow.
 * - DetermineGalleryLayoutInput - The input type for the determineGalleryLayout function.
 * - DetermineGalleryLayoutOutputSchema - Zod schema for the output of the determineGalleryLayout flow.
 * - DetermineGalleryLayoutOutput - The return type for the determineGalleryLayout function.
 */

import {z} from 'zod';

// Base schema for an item (image or folder) without layout
export const GalleryItemInputSchema = z.object({
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
export const GalleryItemLayoutSchema = z.object({
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
