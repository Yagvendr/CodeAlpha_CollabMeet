
import React, { useState } from "react";
import {
  FileUp,
  Download,
  Minus,
  Plus,
  File,
  CheckCircle2,
} from "lucide-react";

function FileUpload({
  file,
  setFile,
  sendFile,
  incomingFile,
  downloadFile,
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      className="
        fixed bottom-6 left-6 z-50
        w-[350px]
        overflow-hidden
        rounded-2xl
        border border-gray-200
        bg-white
        shadow-[0_15px_40px_rgba(0,0,0,0.18)]
      "
    >
      {/* HEADER */}
      <div
        className="
          flex items-center justify-between
          bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600
          px-4 py-3
          text-white
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl
              bg-white/20
              backdrop-blur-sm
            "
          >
            <FileUp size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              File Sharing
            </h3>

            {!minimized && (
              <p className="text-[11px] text-indigo-100">
                Share files securely
              </p>
            )}
          </div>
        </div>

        {/* MINIMIZE BUTTON */}
        <button
          type="button"
          onClick={() => setMinimized(!minimized)}
          className="
            flex h-8 w-8 items-center justify-center
            rounded-lg
            bg-white/10
            transition
            hover:bg-white/20
            active:scale-95
          "
          title={minimized ? "Maximize" : "Minimize"}
        >
          {minimized ? (
            <Plus size={18} />
          ) : (
            <Minus size={18} />
          )}
        </button>
      </div>

      {/* CONTENT */}
      {!minimized && (
        <div className="space-y-4 p-4">

          {/* SELECT FILE AREA */}
          <label
            className="
              group flex cursor-pointer flex-col
              items-center justify-center
              rounded-xl
              border-2 border-dashed border-gray-300
              bg-gray-50
              px-4 py-5
              transition
              hover:border-indigo-400
              hover:bg-indigo-50/50
            "
          >
            <div
              className="
                mb-2 flex h-11 w-11
                items-center justify-center
                rounded-full
                bg-indigo-100
                text-indigo-600
                transition
                group-hover:scale-110
              "
            >
              <FileUp size={21} />
            </div>

            <p className="text-sm font-semibold text-gray-700">
              Choose a file
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Click here to browse files
            </p>

            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
              }}
            />
          </label>

          {/* SELECTED FILE */}
          {file && (
            <div
              className="
                flex items-center gap-3
                rounded-xl
                border border-indigo-100
                bg-indigo-50
                p-3
              "
            >
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-lg
                  bg-white
                  text-indigo-600
                  shadow-sm
                "
              >
                <File size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-700">
                  {file.name}
                </p>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <CheckCircle2
                size={19}
                className="shrink-0 text-green-500"
              />
            </div>
          )}

          {/* SEND BUTTON */}
          <button
            type="button"
            onClick={sendFile}
            disabled={!file}
            className="
              flex w-full items-center
              justify-center gap-2
              rounded-xl
              bg-gradient-to-r
              from-indigo-600 to-purple-600
              px-4 py-2.5
              text-sm font-semibold text-white
              shadow-md
              transition
              hover:-translate-y-0.5
              hover:shadow-lg
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:translate-y-0
              disabled:from-gray-300
              disabled:to-gray-400
              disabled:shadow-none
            "
          >
            <FileUp size={17} />
            Send File
          </button>

          {/* RECEIVED FILE */}
          {incomingFile && (
            <div
              className="
                rounded-xl
                border border-green-200
                bg-gradient-to-br
                from-green-50 to-emerald-50
                p-3
              "
            >
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-lg
                    bg-green-100
                    text-green-600
                  "
                >
                  <CheckCircle2 size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    File Received
                  </p>

                  <p className="truncate text-[11px] text-gray-500">
                    {incomingFile.name}
                  </p>
                </div>
              </div>

              {/* DOWNLOAD */}
              <button
                type="button"
                onClick={downloadFile}
                className="
                  mt-3 flex w-full
                  items-center justify-center gap-2
                  rounded-xl
                  bg-green-600
                  px-3 py-2.5
                  text-sm font-semibold text-white
                  shadow-sm
                  transition
                  hover:bg-green-700
                  hover:shadow-md
                  active:scale-[0.98]
                "
              >
                <Download size={16} />
                Download File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;

