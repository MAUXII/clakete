import { AvatarStyle } from '../utils/avatar-generator';

export interface Testimonial {
  text: string;
  author: string;
  avatarSeed: string;
  avatarStyle: AvatarStyle;
}

export const testimonials: Testimonial[] = [
  {
    text: "I've been using @clakete to rate my films in the past few weeks and I can say - that is the best movie app that I used in my whole life!",
    author: "@zzzzzz",
    avatarSeed: "zzzzzz",
    avatarStyle: "dicebear"
  },
  {
    text: "Finally found the perfect app to track and rate all my favorite films! The interface is beautiful and the community is amazing. @clakete is a game-changer!",
    author: "@kenshiro",
    avatarSeed: "kenshiro",
    avatarStyle: "dicebear"
  },
  {
    text: "As a passionate cinephile, I needed a reliable platform to organize my movie collection. @clakete exceeded all my expectations with its incredible features!",
    author: "@sleeping4ever",
    avatarSeed: "sleeping4ever",
    avatarStyle: "dicebear"
  },
  {
    text: "The social features in @clakete are fantastic! I love seeing what my friends are watching and getting personalized recommendations based on our shared tastes.",
    author: "@podz",
    avatarSeed: "podz",
    avatarStyle: "dicebear"
  },
  {
    text: "Being able to create custom lists and share them with the community has transformed how I discover new films. @clakete understands what movie lovers want!",
    author: "@nel",
    avatarSeed: "nel",
    avatarStyle: "dicebear"
  },
  {
    text: "The rating system in @clakete is so intuitive, and I love how it helps me track my movie-watching journey. It's become my daily companion for film discovery!",
    author: "@luck",
    avatarSeed: "luck",
    avatarStyle: "dicebear"
  },
  {
    text: "From classic films to modern releases, @clakete handles everything perfectly. The curated collections and themes make it easy to find exactly what I want to watch.",
    author: "@btwiluvu",
    avatarSeed: "btwiluvu",
    avatarStyle: "dicebear"
  },
  {
    text: "The watchlist feature is a game-changer! I can easily keep track of movies I want to watch and get notified about new releases. @clakete thinks of everything!",
    author: "@innocenteyes",
    avatarSeed: "innocenteyes",
    avatarStyle: "dicebear"
  }
];
