import Parse from "parse";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

if (!USE_MOCKS) {
  Parse.initialize(import.meta.env.VITE_APP_ID);
  Parse.serverURL = import.meta.env.VITE_SERVER_URL;
}

export default Parse;
