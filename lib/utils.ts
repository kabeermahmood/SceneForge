import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // Don't retry on non-retryable errors
      if (err instanceof Response) {
        if (err.status === 422 || err.status === 400) throw err;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export const SAMPLE_SCRIPT = `The moment you close that door, your dog's world changes completely. Research shows that most dogs experience a spike in cortisol, the stress hormone, within the first 30 minutes of being left alone. Your furry friend walks to the door and sniffs the gap underneath it. They can still smell your scent, but they cannot see you anymore. Some dogs begin to whine softly, while others settle into a quiet, patient wait by the window. Scientists have discovered something fascinating: dogs can actually tell time by how much your scent fades in the house. As the minutes pass and your smell grows weaker, they know you have been gone longer. After about an hour, many dogs will migrate to their favorite comfort spot, often your bed or the couch, because these carry the strongest concentration of your scent. This is not disobedience. It is comfort-seeking behavior, a way for your dog to feel close to you even when you are not there. Some dogs will grab a piece of your clothing, like a sock or a shirt, and carry it around or lay on it. Researchers call this a self-soothing mechanism. Your dog is essentially giving themselves a hug using your scent. As the day goes on, most dogs fall into a routine of napping, occasional window watching, and periodic trips to the door to check if you are back yet. The truly remarkable moment comes when you return. That explosion of joy is not just excitement. Brain scans have shown that a dog's reward centers light up more intensely when reunited with their owner than with any treat or toy. To your dog, you are the best part of their entire world.`;
