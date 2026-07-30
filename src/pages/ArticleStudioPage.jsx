import {
  useEffect,
  useMemo,
  useState
} from "react";
import TopicArticlePage from "../components/topics/TopicArticlePage";
import {
  ARTICLE_BLOCK_TYPES,
  cloneArticleWithNewBlockIds,
  createBlockId,
  createEmptyArticle,
  normalizeDelimitedList,
  normalizeNumericList,
  slugify
} from "../utils/articleSchema";
import { validateArticle } from "../utils/articleValidation";
import "./ArticleStudioPage.css";

const apiBase = "/api/article-studio";

function emptyBlock(type) {
  const id = createBlockId();

  switch (type) {
    case "heading":
      return {
        id,
        type,
        level: 2,
        anchor: "",
        text: ""
      };
    case "image":
      return {
        id,
        type,
        src: "",
        alt: "",
        caption: "",
        width: null,
        height: null
      };
    case "image-grid":
      return {
        id,
        type,
        images: []
      };
    case "list":
      return {
        id,
        type,
        ordered: false,
        items: [""]
      };
    case "quote":
      return {
        id,
        type,
        text: "",
        citation: ""
      };
    case "comparison":
      return {
        id,
        type,
        title: "",
        items: [
          {
            label: "",
            text: ""
          }
        ]
      };
    case "table":
      return {
        id,
        type,
        headers: ["Column 1", "Column 2"],
        rows: [["", ""]]
      };
    case "callout":
      return {
        id,
        type,
        variant: "note",
        title: "",
        text: ""
      };
    case "pokemon-card-grid":
      return {
        id,
        type,
        title: "",
        pokemonIds: [],
        cardSize: "compact"
      };
    case "item-card-grid":
      return {
        id,
        type,
        title: "",
        itemSlugs: [],
        cardSize: "compact"
      };
    case "pokemon-link":
    case "topic-link":
      return {
        id,
        type,
        slug: "",
        label: "",
        text: ""
      };
    case "oak-notes":
      return {
        id,
        type,
        title: "Oak's Notes",
        notes: [""]
      };
    default:
      return {
        id,
        type: "paragraph",
        text: ""
      };
  }
}

async function apiJson(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Article Studio request failed."
    );
  }

  return data;
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  type = "text"
}) {
  const Component = multiline ? "textarea" : "input";

  return (
    <label className="article-studio-field">
      <span>{label}</span>
      <Component
        type={multiline ? undefined : type}
        value={value ?? ""}
        onChange={event =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function NumericListField({
  label,
  values,
  onChange
}) {
  const normalizedValue = (values ?? []).join(", ");
  const [draft, setDraft] =
    useState(normalizedValue);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  return (
    <label className="article-studio-field">
      <span>{label}</span>
      <input
        value={draft}
        onChange={event => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          onChange(normalizeNumericList(nextDraft));
        }}
        onBlur={() =>
          setDraft(
            normalizeNumericList(draft).join(", ")
          )
        }
        placeholder="658, 94, 25"
      />
    </label>
  );
}

function DelimitedListField({
  label,
  values,
  onChange,
  placeholder = ""
}) {
  const normalizedValue = (values ?? []).join(", ");
  const [draft, setDraft] =
    useState(normalizedValue);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  return (
    <label className="article-studio-field">
      <span>{label}</span>
      <input
        value={draft}
        onChange={event => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          onChange(normalizeDelimitedList(nextDraft));
        }}
        onBlur={() =>
          setDraft(
            normalizeDelimitedList(draft).join(", ")
          )
        }
        placeholder={placeholder}
      />
    </label>
  );
}

function DisplaySizeSelect({
  value,
  onChange,
  label = "Display size"
}) {
  return (
    <label className="article-studio-field">
      <span>{label}</span>
      <select
        value={value ?? ""}
        onChange={event =>
          onChange(event.target.value || undefined)
        }
      >
        <option value="">Default</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
        <option value="wide">Wide</option>
        <option value="full">Full width</option>
      </select>
    </label>
  );
}

function PublishToggle({
  active,
  onChange
}) {
  return (
    <section
      className={
        active
          ? "article-studio-publish-toggle is-active"
          : "article-studio-publish-toggle"
      }
    >
      <div>
        <h3>Topic Visibility</h3>
        <p>
          {active
            ? "Active: appears on Topics after saving."
            : "Draft: hidden from Topics after saving."}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => onChange(!active)}
      >
        <span aria-hidden="true" />
        {active ? "Active" : "Draft"}
      </button>
    </section>
  );
}

function ValidationPanel({
  validation
}) {
  return (
    <section className="article-studio-validation">
      <h2>Validation</h2>
      {validation.errors.length === 0 &&
      validation.warnings.length === 0 ? (
        <p>Ready to save.</p>
      ) : (
        <>
          {validation.errors.length > 0 && (
            <div>
              <h3>Errors</h3>
              <ul>
                {validation.errors.map(error => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div>
              <h3>Warnings</h3>
              <ul>
                {validation.warnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AddBlockSelect({
  label = "Add block",
  compact = false,
  onAdd
}) {
  return (
    <label
      className={
        compact
          ? "article-studio-field article-studio-add-block article-studio-add-block-compact"
          : "article-studio-field article-studio-add-block"
      }
    >
      <span>{label}</span>
      <select
        value=""
        onChange={event => {
          if (!event.target.value) return;
          onAdd(event.target.value);
          event.target.value = "";
        }}
      >
        <option value="">Choose type</option>
        {ARTICLE_BLOCK_TYPES.map(type => (
          <option
            key={type}
            value={type}
          >
            {type}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveStatusPanel({
  validation,
  onShowValidation
}) {
  if (validation.errors.length === 0) {
    return null;
  }

  return (
    <section className="article-studio-save-blocked">
      <div>
        <h2>Save blocked</h2>
        <p>{validation.errors[0]}</p>
        {validation.errors.length > 1 && (
          <p>
            {validation.errors.length - 1} more error
            {validation.errors.length === 2 ? "" : "s"} in
            validation.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onShowValidation}
      >
        Show Validation
      </button>
    </section>
  );
}

function ImagePicker({
  article,
  image,
  onChange,
  refreshKey = 0
}) {
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!article?.slug) return;

    apiJson(`/images/${article.slug}`)
      .then(data => setImages(data.images ?? []))
      .catch(() => setImages([]));
  }, [article?.slug, refreshKey]);

  async function upload(file) {
    if (!file) return;

    setBusy(true);
    try {
      const dataUrl = await new Promise(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      );
      const data = await apiJson("/images", {
        method: "POST",
        body: JSON.stringify({
          slug: article.slug,
          filename: file.name,
          dataUrl
        })
      });
      const nextImage = {
        ...image,
        ...data.image
      };
      onChange(nextImage);
      setImages(current => [
        ...current.filter(
          entry => entry.src !== data.image.src
        ),
        {
          src: data.image.src,
          filename:
            data.image.src.split("/").at(-1)
        }
      ]);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="article-studio-image-picker">
      <div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={busy}
          onChange={event =>
            upload(event.target.files?.[0])
          }
        />
        {busy && <span> Uploading...</span>}
      </div>

      {images.length > 0 && (
        <select
          value=""
          onChange={event => {
            const picked = images.find(
              entry => entry.src === event.target.value
            );
            if (picked) {
              onChange({
                ...image,
                src: picked.src
              });
            }
          }}
        >
          <option value="">Choose uploaded image</option>
          {images.map(entry => (
            <option
              key={entry.src}
              value={entry.src}
            >
              {entry.filename}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function ImageGridEditor({
  article,
  images = [],
  onChange,
  imageRefreshKey
}) {
  function updateImage(index, patch) {
    onChange(
      images.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              ...patch
            }
          : image
      )
    );
  }

  function moveImage(index, direction) {
    const target = index + direction;
    const next = [...images];
    [next[index], next[target]] = [
      next[target],
      next[index]
    ];
    onChange(next);
  }

  function addImage() {
    onChange([
      ...images,
      {
        src: "",
        alt: "",
        caption: "",
        width: null,
        height: null
      }
    ]);
  }

  return (
    <div className="article-studio-image-grid-editor">
      {images.length === 0 && (
        <p>No images yet.</p>
      )}

      {images.map((image, index) => (
        <article
          className="article-studio-grid-image"
          key={`${image.src}-${index}`}
        >
          <header>
            <strong>Grid image {index + 1}</strong>
            <div className="article-studio-actions">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveImage(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                disabled={index === images.length - 1}
                onClick={() => moveImage(index, 1)}
              >
                Down
              </button>
              <button
                type="button"
                className="article-studio-danger"
                onClick={() =>
                  onChange(
                    images.filter(
                      (_, imageIndex) =>
                        imageIndex !== index
                    )
                  )
                }
              >
                Remove
              </button>
            </div>
          </header>

          <ImagePicker
            article={article}
            image={image}
            refreshKey={imageRefreshKey}
            onChange={nextImage =>
              updateImage(index, nextImage)
            }
          />

          <TextField
            label="Image path"
            value={image.src}
            onChange={src =>
              updateImage(index, { src })
            }
          />
          <TextField
            label="Alt text"
            value={image.alt}
            onChange={alt =>
              updateImage(index, { alt })
            }
          />
          <TextField
            label="Caption"
            value={image.caption}
            onChange={caption =>
              updateImage(index, { caption })
            }
          />
          <DisplaySizeSelect
            value={image.displaySize}
            onChange={displaySize =>
              updateImage(index, { displaySize })
            }
          />
          <label className="article-studio-inline">
            <input
              type="checkbox"
              checked={image.decorative === true}
              onChange={event =>
                updateImage(index, {
                  decorative: event.target.checked
                })
              }
            />
            Decorative image
          </label>
        </article>
      ))}

      <button
        type="button"
        onClick={addImage}
      >
        Add Image To Grid
      </button>
    </div>
  );
}

function BlockEditor({
  article,
  block,
  index,
  total,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  onInsertAfter,
  imageRefreshKey
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  function update(patch) {
    onChange({
      ...block,
      ...patch
    });
  }

  return (
    <article className="article-studio-block">
      <header>
        <strong>
          {index + 1}. {block.type}
        </strong>
        <div>
          <button
            type="button"
            onClick={() =>
              setCollapsed(value => !value)
            }
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            Up
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            Down
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(index)}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="article-studio-danger"
            onClick={() => onDelete(index)}
          >
            Delete
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="article-studio-block-body">
          {block.type === "paragraph" && (
            <>
              <TextField
                label="Text"
                multiline={true}
                value={block.text}
                onChange={text => update({ text })}
              />
              <p className="article-studio-help-text">
                Link format: [Greninja](/pokemon/greninja),
                [Water Shuriken](/move/water-shuriken),
                [Poke Ball](/item/poke-ball)
              </p>
            </>
          )}

          {block.type === "heading" && (
            <>
              <TextField
                label="Heading text"
                value={block.text}
                onChange={text =>
                  update({
                    text,
                    anchor:
                      block.anchor || slugify(text)
                  })
                }
              />
              <TextField
                label="Anchor"
                value={block.anchor}
                onChange={anchor => update({ anchor })}
              />
              <label className="article-studio-field">
                <span>Level</span>
                <select
                  value={block.level ?? 2}
                  onChange={event =>
                    update({
                      level: Number(event.target.value)
                    })
                  }
                >
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
              </label>
            </>
          )}

          {block.type === "image" && (
            <>
              <ImagePicker
                article={article}
                image={block}
                refreshKey={imageRefreshKey}
                onChange={update}
              />
              <TextField
                label="Image path"
                value={block.src}
                onChange={src => update({ src })}
              />
              <TextField
                label="Alt text"
                value={block.alt}
                onChange={alt => update({ alt })}
              />
              <TextField
                label="Caption"
                value={block.caption}
                onChange={caption =>
                  update({ caption })
                }
              />
              <DisplaySizeSelect
                value={block.displaySize}
                onChange={displaySize =>
                  update({ displaySize })
                }
              />
            </>
          )}

          {block.type === "list" && (
            <>
              <label className="article-studio-inline">
                <input
                  type="checkbox"
                  checked={block.ordered === true}
                  onChange={event =>
                    update({
                      ordered: event.target.checked
                    })
                  }
                />
                Ordered list
              </label>
              <TextField
                label="Items, one per line"
                multiline={true}
                value={(block.items ?? []).join("\n")}
                onChange={items =>
                  update({
                    items: items.split(/\r?\n/)
                  })
                }
              />
            </>
          )}

          {block.type === "quote" && (
            <>
              <TextField
                label="Quote"
                multiline={true}
                value={block.text}
                onChange={text => update({ text })}
              />
              <TextField
                label="Citation"
                value={block.citation}
                onChange={citation =>
                  update({ citation })
                }
              />
            </>
          )}

          {block.type === "callout" && (
            <>
              <TextField
                label="Title"
                value={block.title}
                onChange={title => update({ title })}
              />
              <TextField
                label="Text"
                multiline={true}
                value={block.text}
                onChange={text => update({ text })}
              />
              <p className="article-studio-help-text">
                Links work here too:
                [label](/pokemon/pikachu)
              </p>
            </>
          )}

          {block.type === "pokemon-card-grid" && (
            <>
              <TextField
                label="Title"
                value={block.title}
                onChange={title => update({ title })}
              />
              <NumericListField
                label="Pokemon IDs"
                values={block.pokemonIds ?? []}
                onChange={pokemonIds =>
                  update({
                    pokemonIds
                  })
                }
              />
              <label className="article-studio-field">
                <span>Card size</span>
                <select
                  value={block.cardSize ?? "compact"}
                  onChange={event =>
                    update({
                      cardSize: event.target.value
                    })
                  }
                >
                  <option value="compact">Compact</option>
                  <option value="full">Full</option>
                  <option value="subcompact">Subcompact</option>
                </select>
              </label>
            </>
          )}

          {block.type === "item-card-grid" && (
            <>
              <TextField
                label="Title"
                value={block.title}
                onChange={title => update({ title })}
              />
              <DelimitedListField
                label="Item slugs"
                values={block.itemSlugs ?? []}
                onChange={itemSlugs =>
                  update({
                    itemSlugs
                  })
                }
                placeholder="blue-scarf, prism-scale, wiki-berry"
              />
              <p className="article-studio-help-text">
                Use item URL slugs, like
                prism-scale or blue-scarf.
              </p>
              <label className="article-studio-field">
                <span>Card size</span>
                <select
                  value={block.cardSize ?? "compact"}
                  onChange={event =>
                    update({
                      cardSize: event.target.value
                    })
                  }
                >
                  <option value="compact">Compact</option>
                  <option value="full">Full</option>
                  <option value="subcompact">Subcompact</option>
                </select>
              </label>
            </>
          )}

          {block.type === "pokemon-link" ||
          block.type === "topic-link" ? (
            <>
              <TextField
                label="Slug"
                value={block.slug}
                onChange={slug => update({ slug })}
              />
              <TextField
                label="Label"
                value={block.label}
                onChange={label => update({ label })}
              />
              <TextField
                label="Note"
                value={block.text}
                onChange={text => update({ text })}
              />
            </>
          ) : null}

          {block.type === "image-grid" && (
            <ImageGridEditor
              article={article}
              images={block.images ?? []}
              imageRefreshKey={imageRefreshKey}
              onChange={images => update({ images })}
            />
          )}

          {[
            "comparison",
            "table",
            "oak-notes"
          ].includes(block.type) && (
            <TextField
              label="Block JSON"
              multiline={true}
              value={JSON.stringify(block, null, 2)}
              onChange={value => {
                try {
                  onChange(JSON.parse(value));
                } catch {
                  update({
                    jsonDraft: value
                  });
                }
              }}
            />
          )}
        </div>
      )}

      <AddBlockSelect
        compact={true}
        label="Insert block below"
        onAdd={type => onInsertAfter(index, type)}
      />
    </article>
  );
}

function SourcesEditor({
  sources,
  onChange
}) {
  function update(index, patch) {
    onChange(
      sources.map((source, sourceIndex) =>
        sourceIndex === index
          ? {
              ...source,
              ...patch
            }
          : source
      )
    );
  }

  return (
    <section className="article-studio-editor-section">
      <h2>Sources</h2>
      {sources.map((source, index) => (
        <article
          className="article-studio-source"
          key={index}
        >
          <TextField
            label="Title"
            value={source.title}
            onChange={title =>
              update(index, { title })
            }
          />
          <TextField
            label="Publisher"
            value={source.publisher}
            onChange={publisher =>
              update(index, { publisher })
            }
          />
          <TextField
            label="URL"
            value={source.url}
            onChange={url => update(index, { url })}
          />
          <TextField
            label="Accessed date"
            type="date"
            value={source.accessedDate}
            onChange={accessedDate =>
              update(index, { accessedDate })
            }
          />
          <TextField
            label="Note"
            value={source.note}
            onChange={note => update(index, { note })}
          />
          <div className="article-studio-actions">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => {
                const next = [...sources];
                [next[index - 1], next[index]] = [
                  next[index],
                  next[index - 1]
                ];
                onChange(next);
              }}
            >
              Up
            </button>
            <button
              type="button"
              disabled={index === sources.length - 1}
              onClick={() => {
                const next = [...sources];
                [next[index + 1], next[index]] = [
                  next[index],
                  next[index + 1]
                ];
                onChange(next);
              }}
            >
              Down
            </button>
            <button
              type="button"
              className="article-studio-danger"
              onClick={() =>
                onChange(
                  sources.filter(
                    (_, sourceIndex) =>
                      sourceIndex !== index
                  )
                )
              }
            >
              Remove
            </button>
          </div>
        </article>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...sources,
            {
              title: "",
              publisher: "",
              url: "",
              accessedDate: "",
              note: ""
            }
          ])
        }
      >
        Add Source
      </button>
    </section>
  );
}

function ArticleStudioPage() {
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(
    createEmptyArticle()
  );
  const [savedSlug, setSavedSlug] =
    useState(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("editor");
  const [imageRefreshKey, setImageRefreshKey] =
    useState(0);

  const validation = useMemo(
    () => validateArticle(article),
    [article]
  );
  const filteredArticles = useMemo(
    () =>
      articles.filter(entry =>
        `${entry.title} ${entry.slug}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [articles, search]
  );

  useEffect(() => {
    reloadList();
  }, []);

  useEffect(() => {
    function beforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    );
    return () =>
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      );
  }, [dirty]);

  function patchArticle(patch) {
    setArticle(current => ({
      ...current,
      ...patch
    }));
    setDirty(true);
  }

  function showValidation() {
    setMode("editor");
    window
      .document
      .getElementById("article-studio-validation")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  async function reloadList() {
    try {
      const data = await apiJson("/articles");
      setArticles(data.articles ?? []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openArticle(slug) {
    if (
      dirty &&
      !window.confirm(
        "Discard unsaved changes and switch articles?"
      )
    ) {
      return;
    }

    try {
      const data = await apiJson(`/articles/${slug}`);
      setArticle(data.article);
      setSavedSlug(data.article.slug);
      setDirty(false);
      setStatus(`Loaded ${data.article.slug}.`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function createNewArticle() {
    if (
      dirty &&
      !window.confirm(
        "Discard unsaved changes and create a new article?"
      )
    ) {
      return;
    }

    setArticle(createEmptyArticle());
    setSavedSlug(null);
    setDirty(true);
    setStatus("New draft created.");
  }

  function duplicateCurrentArticle() {
    const copySlug = `${article.slug || "article"}-copy`;
    setArticle({
      ...cloneArticleWithNewBlockIds(article),
      slug: copySlug,
      title: `${article.title || "Untitled"} Copy`,
      publishedDate:
        new Date().toISOString().slice(0, 10),
      updatedDate:
        new Date().toISOString().slice(0, 10)
    });
    setSavedSlug(null);
    setDirty(true);
    setStatus(
      "Duplicated as a draft. Image references still point to the original paths."
    );
  }

  async function deleteCurrentArticle() {
    if (!savedSlug) return;

    const title =
      article.title || savedSlug;

    if (
      !window.confirm(
        `Delete article "${title}"?\n\nThis removes it from Article Studio and the Topics index. A JSON backup will be created, and uploaded images will remain on disk.`
      )
    ) {
      return;
    }

    const confirmation = window.prompt(
      `Type the article slug to confirm deletion:\n\n${savedSlug}`
    );

    if (confirmation !== savedSlug) {
      setStatus("Article deletion cancelled.");
      return;
    }

    try {
      await apiJson(`/articles/${savedSlug}`, {
        method: "DELETE"
      });
      await reloadList();
      setArticle(createEmptyArticle());
      setSavedSlug(null);
      setDirty(false);
      setStatus("Article deleted and backed up.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function saveCurrentArticle() {
    if (validation.errors.length > 0) {
      setStatus("Fix validation errors before saving.");
      return;
    }

    const path = savedSlug
      ? `/articles/${savedSlug}`
      : "/articles";
    const method = savedSlug ? "PUT" : "POST";
    try {
      const data = await apiJson(path, {
        method,
        body: JSON.stringify({
          article
        })
      });
      setArticle(data.article);
      setSavedSlug(data.article.slug);
      setDirty(false);
      await reloadList();
      setStatus("Saved article and updated topic index.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function updateBlock(index, nextBlock) {
    patchArticle({
      sections: article.sections.map(
        (block, blockIndex) =>
          blockIndex === index ? nextBlock : block
      )
    });
  }

  function moveBlock(index, direction) {
    const next = [...article.sections];
    const target = index + direction;
    [next[index], next[target]] = [
      next[target],
      next[index]
    ];
    patchArticle({
      sections: next
    });
  }

  function duplicateBlock(index) {
    const block = {
      ...article.sections[index],
      id: createBlockId()
    };
    const next = [...article.sections];
    next.splice(index + 1, 0, block);
    patchArticle({
      sections: next
    });
  }

  function insertBlockAt(index, type) {
    const next = [...(article.sections ?? [])];
    next.splice(index, 0, emptyBlock(type));
    patchArticle({
      sections: next
    });
  }

  function addBlockToEnd(type) {
    insertBlockAt(
      (article.sections ?? []).length,
      type
    );
  }

  function insertBlockAfter(index, type) {
    insertBlockAt(index + 1, type);
  }

  function deleteBlock(index) {
    if (!window.confirm("Delete this block?")) return;
    patchArticle({
      sections: article.sections.filter(
        (_, blockIndex) => blockIndex !== index
      )
    });
  }

  function clearHeroImage() {
    patchArticle({
      hero: {
        src: "",
        alt: "",
        caption: "",
        width: null,
        height: null
      }
    });
  }

  async function cleanupUnusedImages() {
    if (!article.slug) return;

    if (
      !window.confirm(
        `Clean up unused images for "${article.slug}"?\n\nThis permanently deletes files in public/images/topics/${article.slug}/ that are not referenced by the current editor draft.`
      )
    ) {
      return;
    }

    try {
      const data = await apiJson(
        `/images/${article.slug}/cleanup`,
        {
          method: "POST",
          body: JSON.stringify({
            article
          })
        }
      );
      const result = data.result ?? {};
      const deletedCount =
        result.deletedCount ?? 0;

      setImageRefreshKey(value => value + 1);
      setStatus(
        `Image cleanup complete. Deleted ${deletedCount} unused image${deletedCount === 1 ? "" : "s"}; kept ${result.keptCount ?? 0}.`
      );
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="article-studio">
      <header className="article-studio-topbar">
        <div>
          <h1>PokeLore Article Studio</h1>
          <p>Local development authoring tool</p>
        </div>
        <div className="article-studio-actions">
          <button
            type="button"
            onClick={saveCurrentArticle}
            disabled={validation.errors.length > 0}
          >
            Save
          </button>
          <button
            type="button"
            onClick={duplicateCurrentArticle}
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() =>
              openArticle(savedSlug)
            }
            disabled={!savedSlug}
          >
            Reload
          </button>
          <button
            type="button"
            className="article-studio-danger"
            onClick={deleteCurrentArticle}
            disabled={!savedSlug}
          >
            Delete Article
          </button>
        </div>
      </header>

      <p className="article-studio-status">
        {dirty ? "Unsaved changes. " : ""}
        {status}
      </p>

      <SaveStatusPanel
        validation={validation}
        onShowValidation={showValidation}
      />

      <div className="article-studio-mobile-tabs">
        <button
          type="button"
          onClick={() => setMode("editor")}
          aria-pressed={mode === "editor"}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          aria-pressed={mode === "preview"}
        >
          Preview
        </button>
      </div>

      <div className="article-studio-grid">
        <aside className="article-studio-list">
          <button
            type="button"
            onClick={createNewArticle}
          >
            New Article
          </button>
          <input
            value={search}
            placeholder="Search title or slug"
            onChange={event =>
              setSearch(event.target.value)
            }
          />
          <div className="article-studio-list-items">
            {filteredArticles.map(entry => (
              <button
                key={entry.slug}
                type="button"
                className={
                  entry.slug === savedSlug
                    ? "active"
                    : ""
                }
                onClick={() =>
                  openArticle(entry.slug)
                }
              >
                <strong>{entry.title}</strong>
                <span>{entry.slug}</span>
                <small>
                  <span
                    className={
                      entry.active
                        ? "article-studio-list-badge is-active"
                        : "article-studio-list-badge"
                    }
                  >
                    {entry.active ? "Active" : "Draft"}
                  </span>
                  {entry.updatedDate ||
                    entry.modifiedTime}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <section
          className={
            mode === "preview"
              ? "article-studio-editor is-hidden-mobile"
              : "article-studio-editor"
          }
        >
          <section className="article-studio-editor-section">
            <h2>Metadata</h2>
            <TextField
              label="Title"
              value={article.title}
              onChange={title =>
                patchArticle({
                  title,
                  slug: savedSlug
                    ? article.slug
                    : slugify(title)
                })
              }
            />
            <TextField
              label="Slug"
              value={article.slug}
              onChange={slug =>
                patchArticle({ slug })
              }
            />
            <TextField
              label="Subtitle"
              value={article.subtitle}
              onChange={subtitle =>
                patchArticle({ subtitle })
              }
            />
            <TextField
              label="Excerpt"
              multiline={true}
              value={article.excerpt}
              onChange={excerpt =>
                patchArticle({ excerpt })
              }
            />
            <TextField
              label="Author"
              value={article.author}
              onChange={author =>
                patchArticle({ author })
              }
            />
            <TextField
              label="Category"
              value={article.category}
              onChange={category =>
                patchArticle({ category })
              }
            />
            <PublishToggle
              active={article.active !== false}
              onChange={active =>
                patchArticle({ active })
              }
            />
            <TextField
              label="Tags"
              value={(article.tags ?? []).join(", ")}
              onChange={tags =>
                patchArticle({
                  tags: normalizeDelimitedList(tags)
                })
              }
            />
            <TextField
              label="Published date"
              type="date"
              value={article.publishedDate}
              onChange={publishedDate =>
                patchArticle({ publishedDate })
              }
            />
            <TextField
              label="Updated date"
              type="date"
              value={article.updatedDate}
              onChange={updatedDate =>
                patchArticle({ updatedDate })
              }
            />
            <NumericListField
              label="Related Pokemon IDs"
              values={article.relatedPokemon ?? []}
              onChange={relatedPokemon =>
                patchArticle({
                  relatedPokemon
                })
              }
            />
            <TextField
              label="Related topic slugs"
              value={(article.relatedTopics ?? [])
                .map(topic =>
                  typeof topic === "string"
                    ? topic
                    : topic.slug
                )
                .join(", ")}
              onChange={relatedTopics =>
                patchArticle({
                  relatedTopics:
                    normalizeDelimitedList(relatedTopics)
                })
              }
            />

            <h3>Hero Image</h3>
            <ImagePicker
              article={article}
              image={article.hero}
              refreshKey={imageRefreshKey}
              onChange={hero =>
                patchArticle({ hero })
              }
            />
            <button
              type="button"
              className="article-studio-secondary-action"
              disabled={!article.slug}
              onClick={cleanupUnusedImages}
            >
              Clean Up Unused Images
            </button>
            <button
              type="button"
              className="article-studio-danger article-studio-secondary-action"
              disabled={
                !article.hero?.src &&
                !article.hero?.thumbnail
              }
              onClick={clearHeroImage}
            >
              Remove Hero Image
            </button>
            <TextField
              label="Hero path"
              value={article.hero?.src}
              onChange={src =>
                patchArticle({
                  hero: {
                    ...article.hero,
                    src
                  }
                })
              }
            />
            <TextField
              label="Hero alt"
              value={article.hero?.alt}
              onChange={alt =>
                patchArticle({
                  hero: {
                    ...article.hero,
                    alt
                  }
                })
              }
            />
            <TextField
              label="Hero caption"
              value={article.hero?.caption}
              onChange={caption =>
                patchArticle({
                  hero: {
                    ...article.hero,
                    caption
                  }
                })
              }
            />
            <DisplaySizeSelect
              label="Hero display size"
              value={article.hero?.displaySize}
              onChange={displaySize =>
                patchArticle({
                  hero: {
                    ...article.hero,
                    displaySize
                  }
                })
              }
            />
          </section>

          <div id="article-studio-validation">
            <ValidationPanel validation={validation} />
          </div>

          <section className="article-studio-editor-section">
            <h2>Blocks</h2>
            {(article.sections ?? []).map(
              (block, index) => (
                <BlockEditor
                  key={block.id}
                  article={article}
                  block={block}
                  index={index}
                  total={article.sections.length}
                  onChange={nextBlock =>
                    updateBlock(index, nextBlock)
                  }
                  onMove={moveBlock}
                  onDuplicate={duplicateBlock}
                  onDelete={deleteBlock}
                  onInsertAfter={insertBlockAfter}
                  imageRefreshKey={imageRefreshKey}
                />
              )
            )}

            <AddBlockSelect
              label="Add block to end"
              onAdd={addBlockToEnd}
            />
          </section>

          <SourcesEditor
            sources={article.sources ?? []}
            onChange={sources =>
              patchArticle({ sources })
            }
          />
        </section>

        <section
          className={
            mode === "editor"
              ? "article-studio-preview is-hidden-mobile"
              : "article-studio-preview"
          }
        >
          <TopicArticlePage
            article={article}
            preview={true}
          />
        </section>
      </div>
    </main>
  );
}

export default ArticleStudioPage;
