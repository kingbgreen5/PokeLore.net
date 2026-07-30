const WORDS_PER_MINUTE = 225;

function collectTextFromBlock(block) {
  if (!block || typeof block !== "object") {
    return [];
  }

  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
      return [block.text];
    case "list":
      return block.items ?? [];
    case "callout":
      return [block.title, block.text];
    case "pokemon-card-grid":
    case "item-card-grid":
      return [block.title];
    case "oak-notes":
      return [
        block.title,
        ...(block.notes ?? []),
        ...((block.sections ?? []).flatMap(section => [
          section.heading,
          ...(section.body ?? [])
        ]))
      ];
    case "comparison":
      return [
        block.title,
        ...((block.items ?? []).flatMap(item => [
          item.label,
          item.text
        ]))
      ];
    case "table":
      return [
        ...(block.headers ?? []),
        ...((block.rows ?? []).flat())
      ];
    default:
      return [];
  }
}

export function countArticleWords(article) {
  const text = [
    article?.title,
    article?.subtitle,
    article?.excerpt,
    ...((article?.sections ?? []).flatMap(
      collectTextFromBlock
    ))
  ]
    .filter(Boolean)
    .join(" ");

  const words = text.match(/\b[\w'-]+\b/g);
  return words?.length ?? 0;
}

export function calculateReadingTime(article) {
  const words = countArticleWords(article);

  return Math.max(
    1,
    Math.ceil(words / WORDS_PER_MINUTE)
  );
}
