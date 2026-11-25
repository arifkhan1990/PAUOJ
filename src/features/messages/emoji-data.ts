export type EmojiEntry = { char: string; name: string };

export type EmojiGroup = {
  label: string;
  items: readonly EmojiEntry[];
};

/**
 * Curated composer emoji. Kept small and searchable on purpose: the picker is a
 * popover, not a full emoji keyboard, so every entry is high-signal for chat.
 */
export const EMOJI_GROUPS: readonly EmojiGroup[] = [
  {
    label: "Smileys",
    items: [
      { char: "😀", name: "grinning face" },
      { char: "😄", name: "smiling face" },
      { char: "😁", name: "beaming face" },
      { char: "😂", name: "face with tears of joy" },
      { char: "🤣", name: "rolling on the floor laughing" },
      { char: "😊", name: "smiling face with smiling eyes" },
      { char: "😍", name: "smiling face with heart eyes" },
      { char: "🙂", name: "slightly smiling face" },
      { char: "😉", name: "winking face" },
      { char: "😎", name: "smiling face with sunglasses" },
      { char: "🤔", name: "thinking face" },
      { char: "😐", name: "neutral face" },
      { char: "😴", name: "sleeping face" },
      { char: "😢", name: "crying face" },
      { char: "😭", name: "loudly crying face" },
      { char: "😡", name: "angry face" },
      { char: "😅", name: "grinning face with sweat" },
      { char: "🙃", name: "upside-down face" },
      { char: "😇", name: "smiling face with halo" },
      { char: "🤗", name: "hugging face" },
      { char: "🤩", name: "star-struck face" },
      { char: "🥳", name: "partying face" },
      { char: "😬", name: "grimacing face" },
      { char: "😱", name: "face screaming in fear" },
      { char: "😋", name: "face savoring food" },
      { char: "😜", name: "winking face with tongue" },
      { char: "🤪", name: "zany face" },
      { char: "🤨", name: "face with raised eyebrow" },
      { char: "😏", name: "smirking face" },
      { char: "😌", name: "relieved face" },
      { char: "😔", name: "pensive face" },
      { char: "🤯", name: "exploding head" },
      { char: "🥲", name: "smiling face with tear" },
      { char: "😷", name: "face with medical mask" },
      { char: "🤢", name: "nauseated face" },
      { char: "🥺", name: "pleading face" },
      { char: "😳", name: "flushed face" },
      { char: "🤫", name: "shushing face" },
      { char: "🤭", name: "face with hand over mouth" },
      { char: "😶", name: "face without mouth" },
    ],
  },
  {
    label: "Gestures",
    items: [
      { char: "👍", name: "thumbs up" },
      { char: "👎", name: "thumbs down" },
      { char: "👏", name: "clapping hands" },
      { char: "🙌", name: "raising hands" },
      { char: "👋", name: "waving hand" },
      { char: "🤝", name: "handshake" },
      { char: "✌️", name: "victory hand" },
      { char: "🤞", name: "crossed fingers" },
      { char: "👌", name: "ok hand" },
      { char: "🙏", name: "folded hands" },
      { char: "💪", name: "flexed biceps" },
      { char: "🫡", name: "saluting face" },
      { char: "🤙", name: "call me hand" },
      { char: "👊", name: "fist" },
      { char: "🤟", name: "love you gesture" },
      { char: "✋", name: "raised hand" },
      { char: "👉", name: "pointing right" },
      { char: "👀", name: "eyes" },
    ],
  },
  {
    label: "Symbols",
    items: [
      { char: "❤️", name: "red heart" },
      { char: "🧡", name: "orange heart" },
      { char: "💙", name: "blue heart" },
      { char: "💚", name: "green heart" },
      { char: "💜", name: "purple heart" },
      { char: "🖤", name: "black heart" },
      { char: "🤍", name: "white heart" },
      { char: "💔", name: "broken heart" },
      { char: "🔥", name: "fire" },
      { char: "✨", name: "sparkles" },
      { char: "💫", name: "dizzy" },
      { char: "🎉", name: "party popper" },
      { char: "💯", name: "hundred points" },
      { char: "✅", name: "check mark" },
      { char: "❌", name: "cross mark" },
      { char: "⚠️", name: "warning" },
      { char: "⭐", name: "star" },
      { char: "🏆", name: "trophy" },
      { char: "🎯", name: "target" },
      { char: "🚀", name: "rocket" },
      { char: "💡", name: "light bulb" },
      { char: "➕", name: "plus" },
      { char: "➖", name: "minus" },
      { char: "❓", name: "question mark" },
      { char: "❗", name: "exclamation mark" },
      { char: "♻️", name: "recycle" },
      { char: "🔔", name: "bell" },
      { char: "🔒", name: "lock" },
      { char: "🔑", name: "key" },
      { char: "📣", name: "megaphone" },
      { char: "💬", name: "speech balloon" },
      { char: "🆗", name: "ok button" },
    ],
  },
  {
    label: "Food & Nature",
    items: [
      { char: "☕", name: "hot beverage" },
      { char: "🍕", name: "pizza" },
      { char: "🍔", name: "hamburger" },
      { char: "🍟", name: "french fries" },
      { char: "🍜", name: "steaming bowl" },
      { char: "🍣", name: "sushi" },
      { char: "🥗", name: "green salad" },
      { char: "🍎", name: "red apple" },
      { char: "🍌", name: "banana" },
      { char: "🍇", name: "grapes" },
      { char: "🍓", name: "strawberry" },
      { char: "🥑", name: "avocado" },
      { char: "🥕", name: "carrot" },
      { char: "🍞", name: "bread" },
      { char: "🧁", name: "cupcake" },
      { char: "🍪", name: "cookie" },
      { char: "🍫", name: "chocolate bar" },
      { char: "🌙", name: "crescent moon" },
      { char: "🌞", name: "sun with face" },
      { char: "🌻", name: "sunflower" },
      { char: "🌸", name: "cherry blossom" },
      { char: "🍀", name: "four leaf clover" },
      { char: "🌳", name: "deciduous tree" },
      { char: "🌊", name: "water wave" },
      { char: "🐱", name: "cat face" },
      { char: "🐶", name: "dog face" },
      { char: "🦊", name: "fox face" },
      { char: "🐼", name: "panda face" },
      { char: "🦄", name: "unicorn face" },
      { char: "🐢", name: "turtle" },
      { char: "🐝", name: "honeybee" },
      { char: "🦋", name: "butterfly" },
    ],
  },
  {
    label: "Objects",
    items: [
      { char: "📷", name: "camera" },
      { char: "💻", name: "laptop" },
      { char: "🧑‍💻", name: "technologist" },
      { char: "🖥️", name: "desktop computer" },
      { char: "⌨️", name: "keyboard" },
      { char: "🖱️", name: "mouse" },
      { char: "📱", name: "mobile phone" },
      { char: "🎧", name: "headphones" },
      { char: "📝", name: "memo" },
      { char: "📌", name: "pushpin" },
      { char: "📚", name: "books" },
      { char: "🎓", name: "graduation cap" },
      { char: "🧠", name: "brain" },
      { char: "🎮", name: "video game" },
      { char: "🎨", name: "palette" },
      { char: "🔬", name: "microscope" },
      { char: "🔭", name: "telescope" },
      { char: "⌚", name: "watch" },
      { char: "📎", name: "paperclip" },
      { char: "🗂️", name: "card index dividers" },
      { char: "🪄", name: "magic wand" },
      { char: "🧩", name: "puzzle piece" },
      { char: "🎲", name: "game die" },
      { char: "🔧", name: "wrench" },
      { char: "⚡", name: "high voltage" },
    ],
  },
];

function normalize(value: string): string {
  return value.toLocaleLowerCase("en");
}

/**
 * Filters curated groups by a free-text query. Every whitespace-separated token
 * must match the emoji name (case-insensitive substring) or its character.
 * Groups with no matches are dropped so the popover never shows empty headings.
 */
export function filterEmojiGroups(
  groups: readonly EmojiGroup[],
  query: string,
): EmojiGroup[] {
  const tokens = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return groups.map((group) => ({ ...group }));

  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        const name = normalize(item.name);
        const char = normalize(item.char);
        return tokens.every(
          (token) => name.includes(token) || char.includes(token),
        );
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function countEmoji(groups: readonly EmojiGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
