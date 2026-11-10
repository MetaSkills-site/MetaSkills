/**
 * @file Editor.jsx (TextBox)
 * @description A comprehensive rich-text editor built on Slate.js.
 * It supports common formatting (bold, italic, underline), alignment,
 * and advanced content types like LaTeX math, tables, images (with upload),
 * and interactive blanks for quiz creation.
 *
 * @dependencies
 * - axios: For handling image uploads to GCS via signed URLs.
 * - radix-ui: For accessible dialog components.
 * - react-hot-toast: For transaction notifications.
 * - slate, slate-react, slate-history: The core rich-text editing framework.
 * - mathlive: For rendering math expressions inside the editor.
 * - various icons: For the toolbar buttons.
 *
 * @exports TextBox (default)
 * @interconnections Used in WriteQuestion, WriteAnswer, and WriteExplanation for all content input.
 */

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import { EditorMain, Toolbar, Field } from "./Editor.style";
import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import { uploadFileToGCS } from "../../services/uploadService";
import { Editor, Element, Transforms, createEditor, Range } from "slate";
import { Slate, withReact, useSlateStatic, ReactEditor } from "slate-react";
import { withHistory } from "slate-history";
import { GoBold } from "react-icons/go";
import { PiRectangleDashedDuotone } from "react-icons/pi";
import { PiTextUnderlineBold, PiTextItalicBold } from "react-icons/pi";
import { TbMathSymbols } from "react-icons/tb";
import {
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
} from "react-icons/fa6";
import { FaRegImages, FaTable } from "react-icons/fa6";
import { FaUpload } from "react-icons/fa6";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import CommonDialog from "../common/CommonDialog";
import Tooltip from "../Tooltip";
import styled from "styled-components";
import MathField from "../MathField";
import {
  DialogButtonGroup,
  DialogButton,
  FormField,
  FormLabel,
  FormInput,
} from "../admin/AdminStyles";
import { StyledBlankInput } from "../admin/AdminStyles";

// Element components define how Slate nodes are rendered in the view
const BoldElement = ({ children, attributes }) => {
  return <b {...attributes}>{children}</b>;
};
const ItalicElement = ({ children, attributes }) => {
  return <i {...attributes}>{children}</i>;
};
const UnderlineElement = ({ children, attributes }) => {
  return <u {...attributes}>{children}</u>;
};
const DefaultElement = ({ children, attributes, element }) => {
  return (
    <p {...attributes} style={{ textAlign: element.align || "left" }}>
      {children}
    </p>
  );
};

const TableElement = ({ attributes, children }) => {
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%", margin: "10px 0" }}>
      <table
        {...attributes}
        style={{
          width: "100%",
          minWidth: "400px",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

const TableRowElement = ({ attributes, children }) => {
  return <tr {...attributes}>{children}</tr>;
};

const TableCellElement = ({ attributes, children, element }) => {
  return (
    <td
      {...attributes}
      style={{
        border: "1px solid #ddd",
        padding: "8px",
        verticalAlign: "top",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        backgroundColor: element.background,
      }}
    >
      {children}
    </td>
  );
};

/**
 * InlineBlank Component
 * Renders an interactive text input inside the editor, used for creating "Fill in the Blanks" questions.
 */
const InlineBlank = ({ attributes, children, element }) => {
  const editor = useSlateStatic();
  const [value, setValue] = useState(element.correctAnswer || "");

  useEffect(() => {
    setValue(element.correctAnswer || "");
  }, [element.correctAnswer]);

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        display: "inline-block",
        margin: "0 2px",
        verticalAlign: "middle",
      }}
    >
      <StyledBlankInput
        type="text"
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          setValue(newValue);
          const path = ReactEditor.findPath(editor, element);
          if (path) {
            Transforms.setNodes(
              editor,
              { correctAnswer: newValue },
              { at: path },
            );
          }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder="Answer"
      />
      {children}
    </span>
  );
};

const Leaf = ({ attributes, children, leaf }) => {
  let inner = children;
  if (leaf.bold) inner = <strong>{inner}</strong>;
  if (leaf.italic) inner = <em>{inner}</em>;
  if (leaf.underline) inner = <u>{inner}</u>;
  return <span {...attributes}>{inner}</span>;
};

const Upload = styled.div`
  box-sizing: content-box;
  padding: 20px;
  background: #e4704d28;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  margin: 30px auto;
  cursor: pointer;
  transition: 500ms;
  &:hover {
    background: #e4704d50;
  }
  > * {
    fill: #df4523ff;
    width: 100%;
    height: 100%;
  }
`;
const Thumbnail = styled.div`
  > img {
    min-width: 60px;
    max-width: 80%;
    margin: 15px auto;
    display: block;
    padding: 10px;
    box-sizing: content-box;
    border: dotted 4px #4caf50;
    border-radius: 10px;
    background: #e8f5e9;
  }
`;

const MAX_TABLE_DIMENSION = 20;

const TextBox = memo(function TextBox({
  value,
  onChange,
  placeholder,
  compact,
  disabled,
  ...props
}) {
  const [count, setCount] = useState(0);
  const [isThumb, showThumb] = useState(false);
  const [thumbData, setThumbData] = useState(null);
  const [latex, setLatex] = useState("");
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [coloredFirstRow, setColoredFirstRow] = useState(false);
  const [coloredFirstColumn, setColoredFirstColumn] = useState(false);
  const bold = useRef();
  const italic = useRef();
  const underline = useRef();
  const fileInput = useRef();
  const thumbRef = useRef();
  const lastInjectedValueRef = useRef(null);
  let mathRef = useRef();

  /**
   * Slate plugin to handle special behavior for void nodes (images, math, blanks).
   * It ensures they are treated as atomic units during deletion and selection.
   */
  const withImages = (editor) => {
    const { isVoid, deleteBackward, isInline } = editor;

    editor.isVoid = (element) =>
      element.type === "image" ||
      element.type === "math" ||
      element.type === "inline-blank" ||
      isVoid(element);

    editor.isInline = (element) => {
      return (
        (element.type === "math" && element.inline) ||
        element.type === "inline-blank" ||
        isInline(element)
      );
    };

    editor.deleteBackward = (...args) => {
      const { selection } = editor;

      if (selection && Range.isCollapsed(selection)) {
        const prev = Editor.before(editor, selection);
        if (prev) {
          const entry = Editor.above(editor, { at: prev });
          if (entry) {
            const [node, path] = entry;
            if (
              node &&
              (node.type === "image" ||
                node.type === "math" ||
                editor.isVoid(node))
            ) {
              Transforms.removeNodes(editor, { at: path });
              return;
            }
          }
        }
        const [currentNode, path] =
          Editor.above(editor, {
            match: (n) => Editor.isBlock(editor, n),
          }) || [];
        if (
          currentNode &&
          Editor.isBlock(editor, currentNode) &&
          Editor.isEmpty(editor, currentNode) &&
          Editor.isStart(editor, selection.anchor, path)
        ) {
          Transforms.removeNodes(editor, { at: path });
          return;
        }
      }
      deleteBackward(...args);
    };

    return editor;
  };

  const editor = useMemo(
    () => withHistory(withImages(withReact(createEditor()))),
    [],
  );

  /**
   * Synchronizes external value changes (e.g., from EditorContext) into the Slate editor.
   * This is crucial for collaborative editing or when content is loaded from a database.
   */
  useEffect(() => {
    if (!Array.isArray(value)) return;

    if (lastInjectedValueRef.current === value) return;

    lastInjectedValueRef.current = value;

    Transforms.deselect(editor);
    editor.children = value;
    editor.onChange();
  }, [value, editor]);

  /**
   * Determines how different Slate element types are rendered.
   */
  const renderElement = useCallback((props, children) => {
    switch (props.element.type) {
      case "bold":
        return <BoldElement {...props} />;
      case "italic":
        return <ItalicElement {...props} />;
      case "underline":
        return <UnderlineElement {...props} />;
      case "image":
        return (
          <div {...props.attributes}>
            <div
              contentEditable={false}
              style={{ maxWidth: "100%", overflow: "hidden" }}
            >
              <img
                src={props.element.url}
                alt={props.element.alt || ""}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "20em",
                  objectFit: "contain",
                  margin: "0 auto",
                }}
              />
            </div>
            {children}
          </div>
        );
      case "math": {
        const isInline = props.element.inline;
        return (
          <span
            {...props.attributes}
            style={{
              verticalAlign: "middle",
              margin: isInline ? "0 2px" : "10px 0",
              display: isInline ? "inline-block" : "block",
            }}
          >
            <MathField
              readOnly
              contentEditable={false}
              virtualKeyboardMode="off"
              value={props.element.latex}
              style={{
                display: isInline ? "inline-block" : "block",
                width: isInline ? "auto" : "100%",
                maxWidth: "100%",
                overflowX: "auto",
                fontSize: "1em",
                padding: isInline ? "0" : "8px",
                background: "transparent",
                border: "none",
              }}
            />
            {children}
          </span>
        );
      }
      case "table":
        return <TableElement {...props} />;
      case "table-row":
        return <TableRowElement {...props} />;
      case "table-cell":
        return <TableCellElement {...props} />;
      case "inline-blank":
        return <InlineBlank {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const initialValue = Array.isArray(value)
    ? value
    : value?.slate || [{ type: "paragraph", children: [{ text: "" }] }];

  /**
   * Utility to insert an image node into the editor.
   */
  const insertImage = (editor, url) => {
    const imageNode = {
      type: "image",
      url,
      children: [{ text: "" }],
    };
    const emptyParagraph = {
      type: "paragraph",
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, imageNode);
    Transforms.insertNodes(editor, emptyParagraph);
  };

  /**
   * Utility to insert a math node (inline or block) into the editor.
   */
  const insertMath = (editor, latex, isInline = false) => {
    const mathNode = {
      type: "math",
      latex,
      inline: isInline,
      children: [{ text: "" }],
    };

    if (isInline) {
      Transforms.insertNodes(editor, mathNode);
    } else {
      const emptyParagraph = {
        type: "paragraph",
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, mathNode);
      Transforms.insertNodes(editor, emptyParagraph);
    }
  };

  /**
   * Utility to insert a structured table node into the editor.
   */
  const insertTable = (editor, rows, cols, coloredRow, coloredCol) => {
    const clampedRows = Math.min(Math.max(rows, 1), MAX_TABLE_DIMENSION);
    const clampedCols = Math.min(Math.max(cols, 1), MAX_TABLE_DIMENSION);

    const table = {
      type: "table",
      children: Array.from({ length: clampedRows }, (_, rowIndex) => ({
        type: "table-row",
        children: Array.from({ length: clampedCols }, (_, colIndex) => {
          const isColored =
            (coloredRow && rowIndex === 0) || (coloredCol && colIndex === 0);
          return {
            type: "table-cell",
            background: isColored ? "#f5f5f5" : undefined,
            children: [{ type: "paragraph", children: [{ text: "" }] }],
          };
        }),
      })),
    };
    const emptyParagraph = {
      type: "paragraph",
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, [table, emptyParagraph]);
  };

  /**
   * Utility to insert an inline blank node.
   * If text is selected, it becomes the default answer for the blank.
   */
  const insertBlank = (editor) => {
    const { selection } = editor;
    let selectedText = "";

    if (selection && !Range.isCollapsed(selection)) {
      selectedText = Editor.string(editor, selection);
      Transforms.delete(editor);
    }

    const blankNode = {
      type: "inline-blank",
      correctAnswer: selectedText,
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, blankNode);
    Transforms.move(editor);
  };

  /**
   * Toggles a rich-text mark (bold, italic, underline) on the current selection.
   */
  const toggleMark = (editor, format) => {
    const marks = Editor.marks(editor);
    const isActive = marks ? marks[format] === true : false;
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  /**
   * Toggles text alignment for the current block.
   */
  const toggleAlignment = (editor, align) => {
    Transforms.setNodes(
      editor,
      { align },
      { match: (n) => Element.isElement(n) && n.type === "paragraph" },
    );
  };

  /**
   * Handles image file uploads.
   * Requests a signed URL from the backend and then puts the file to GCS.
   */
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File size exceeds maximum allowed size (5MB)");
      return;
    }

    const toastId = toast.loading("Uploading image...");

    try {
      const {
        data: { signedUrl, publicUrl },
      } = await adminApiClient.post(API_ENDPOINTS.getSignedUploadUrl.url, {
        filename: file.name,
        contentType: file.type,
      });

      await uploadFileToGCS(signedUrl, file);

      insertImage(editor, publicUrl);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  const editorFunctions = useMemo(
    () => ({
      bold: (e) => {
        e.preventDefault();
        toggleMark(editor, "bold");
      },
      italic: (e) => {
        e.preventDefault();
        toggleMark(editor, "italic");
      },
      underline: (e) => {
        e.preventDefault();
        toggleMark(editor, "underline");
      },
    }),
    [editor],
  );

  const handleAlignLeft = useCallback(
    (e) => {
      e.preventDefault();
      toggleAlignment(editor, "left");
    },
    [editor],
  );

  const handleAlignCenter = useCallback(
    (e) => {
      e.preventDefault();
      toggleAlignment(editor, "center");
    },
    [editor],
  );

  const handleAlignRight = useCallback(
    (e) => {
      e.preventDefault();
      toggleAlignment(editor, "right");
    },
    [editor],
  );

  const handleAlignJustify = useCallback(
    (e) => {
      e.preventDefault();
      toggleAlignment(editor, "justify");
    },
    [editor],
  );

  const handleInsertBlank = useCallback(
    (e) => {
      e.preventDefault();
      insertBlank(editor);
    },
    [editor],
  );

  const handleSlateChange = useCallback(
    (value) => {
      if (editor.children.length === 0) {
        Transforms.insertNodes(editor, {
          type: "paragraph",
          children: [{ text: "" }],
        });
      }
      if (typeof onChange === "function") {
        lastInjectedValueRef.current = value;
        onChange(value);
      }
      const marks = Editor.marks(editor) || {};
      const text = Editor.string(editor, []);
      setCount(text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
      if (bold.current) {
        bold.current.style.background = marks.bold
          ? "#b55b3e17"
          : "transparent";
      }
      if (italic.current) {
        italic.current.style.background = marks.italic
          ? "#b55b3e17"
          : "transparent";
      }
      if (underline.current) {
        underline.current.style.background = marks.underline
          ? "#b55b3e17"
          : "transparent";
      }
    },
    [editor, onChange],
  );

  return (
    <EditorMain
      id="editor"
      $column
      $compact={compact}
      style={
        disabled
          ? { opacity: 0.6, pointerEvents: "none", userSelect: "none" }
          : undefined
      }
      {...props}
    >
      <Toolbar>
        <Flex
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: compact ? "center" : "flex-start",
          }}
        >
          <span ref={bold} onMouseDown={editorFunctions.bold}>
            <Tooltip text="Bold">
              <GoBold />
            </Tooltip>
          </span>
          <span ref={italic} onMouseDown={editorFunctions.italic}>
            <Tooltip text="Italic">
              <PiTextItalicBold />
            </Tooltip>
          </span>
          <span ref={underline} onMouseDown={editorFunctions.underline}>
            <Tooltip text="Underline">
              <PiTextUnderlineBold />
            </Tooltip>
          </span>
          <span onMouseDown={handleAlignLeft}>
            <Tooltip text="Align Left">
              <FaAlignLeft />
            </Tooltip>
          </span>
          <span onMouseDown={handleAlignCenter}>
            <Tooltip text="Align Center">
              <FaAlignCenter />
            </Tooltip>
          </span>
          <span onMouseDown={handleAlignRight}>
            <Tooltip text="Align Right">
              <FaAlignRight />
            </Tooltip>
          </span>
          <span onMouseDown={handleAlignJustify}>
            <Tooltip text="Align Justify">
              <FaAlignJustify />
            </Tooltip>
          </span>
          <span onMouseDown={handleInsertBlank}>
            <Tooltip text="Insert Blank (Ctrl+_)">
              <PiRectangleDashedDuotone />
            </Tooltip>
          </span>

          <CommonDialog
            trigger={
              <span>
                <Tooltip text="Insert math">
                  <TbMathSymbols />
                </Tooltip>
              </span>
            }
            title="Insert math"
            description="Please write the mathematical expression below"
          >
            <MathField
              value={latex}
              ref={mathRef}
              style={{
                width: "100%",
                fontSize: "20px",
                marginBottom: "20px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
            <Font $size="12px" $color="#666">
              Click inline for placing expression in the same line as text, or
              click block for placing expression in a new line.
            </Font>
            <DialogButtonGroup>
              <Dialog.Close asChild>
                <DialogButton>Cancel</DialogButton>
              </Dialog.Close>
              <Dialog.Close asChild>
                <DialogButton
                  $primary
                  onClick={() => {
                    setLatex(mathRef.current.value);
                    insertMath(editor, mathRef.current.value, true);
                  }}
                >
                  Insert as inline
                </DialogButton>
              </Dialog.Close>
              <Dialog.Close asChild>
                <DialogButton
                  $primary
                  onClick={() => {
                    setLatex(mathRef.current.value);
                    insertMath(editor, mathRef.current.value, false);
                  }}
                >
                  Insert as block
                </DialogButton>
              </Dialog.Close>
            </DialogButtonGroup>
          </CommonDialog>

          <CommonDialog
            trigger={
              <span>
                <Tooltip text="Insert image">
                  <FaRegImages />
                </Tooltip>
              </span>
            }
            title="Insert image"
            description="Please upload the image you want to insert"
          >
            <Thumbnail style={isThumb ? {} : { display: "none" }}>
              <img ref={thumbRef} src={thumbData} />
            </Thumbnail>
            <Upload onClick={() => fileInput.current.click()}>
              <input
                type="file"
                ref={fileInput}
                accept="image/*"
                style={{ display: "none" }}
                onChange={function (e) {
                  const file = e.target.files[0];
                  if (!file) return;
                  thumbRef.current.file = file;
                  showThumb(true);

                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setThumbData(e.target.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <FaUpload />
            </Upload>

            <DialogButtonGroup>
              <Dialog.Close asChild>
                <DialogButton>Cancel</DialogButton>
              </Dialog.Close>
              <Dialog.Close asChild>
                <DialogButton
                  $primary
                  onClick={async () => {
                    await handleImageUpload(thumbRef.current.file);
                  }}
                  disabled={!isThumb}
                >
                  Insert
                </DialogButton>
              </Dialog.Close>
            </DialogButtonGroup>
          </CommonDialog>

          <CommonDialog
            trigger={
              <span>
                <Tooltip text="Insert table">
                  <FaTable />
                </Tooltip>
              </span>
            }
            title="Insert Table"
            description="Enter the number of rows and columns"
          >
            <Flex style={{ gap: "20px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <FormField>
                  <FormLabel>Rows</FormLabel>
                  <FormInput
                    type="number"
                    min="1"
                    max={MAX_TABLE_DIMENSION}
                    value={tableRows}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTableRows(
                        isNaN(val)
                          ? 1
                          : Math.min(Math.max(val, 1), MAX_TABLE_DIMENSION),
                      );
                    }}
                  />
                </FormField>
              </div>
              <div style={{ flex: 1 }}>
                <FormField>
                  <FormLabel>Columns</FormLabel>
                  <FormInput
                    type="number"
                    min="1"
                    max={MAX_TABLE_DIMENSION}
                    value={tableCols}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTableCols(
                        isNaN(val)
                          ? 1
                          : Math.min(Math.max(val, 1), MAX_TABLE_DIMENSION),
                      );
                    }}
                  />
                </FormField>
              </div>
            </Flex>

            <Flex style={{ gap: "20px", marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                <input
                  type="checkbox"
                  checked={coloredFirstRow}
                  onChange={(e) => setColoredFirstRow(e.target.checked)}
                />
                Colored first row
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                <input
                  type="checkbox"
                  checked={coloredFirstColumn}
                  onChange={(e) => setColoredFirstColumn(e.target.checked)}
                />
                Colored first column
              </label>
            </Flex>

            <DialogButtonGroup>
              <Dialog.Close asChild>
                <DialogButton>Cancel</DialogButton>
              </Dialog.Close>
              <Dialog.Close asChild>
                <DialogButton
                  $primary
                  onClick={() =>
                    insertTable(
                      editor,
                      tableRows,
                      tableCols,
                      coloredFirstRow,
                      coloredFirstColumn,
                    )
                  }
                >
                  Insert
                </DialogButton>
              </Dialog.Close>
            </DialogButtonGroup>
          </CommonDialog>
        </Flex>
        <Font
          $weight={800}
          $color="#e2623f"
          style={{
            margin: compact ? "10px auto" : "auto 40px",
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
        >
          {`${count} words`}
        </Font>
      </Toolbar>
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={handleSlateChange}
      >
        <Field
          placeholder={placeholder}
          renderElement={renderElement}
          renderLeaf={Leaf}
          onKeyDown={(event) => {
            if (!event.ctrlKey) return;
            switch (event.key) {
              case "z": {
                event.preventDefault();
                editor.undo();
                break;
              }
              case "y": {
                event.preventDefault();
                editor.redo();
                break;
              }
              case "b": {
                editorFunctions.bold(event);
                break;
              }
              case "i": {
                editorFunctions.italic(event);
                break;
              }
              case "u": {
                editorFunctions.underline(event);
                break;
              }
              case "_":
              case "-": {
                event.preventDefault();
                insertBlank(editor);
                break;
              }
            }
          }}
          autoFocus
          onPaste={(event) => {
            if (event.clipboardData.files.length > 0) {
              const file = event.clipboardData.files[0];
              if (file.type.startsWith("image/")) {
                event.preventDefault();
                handleImageUpload(file);
              }
            }
          }}
        />
      </Slate>
    </EditorMain>
  );
});

export default TextBox;
