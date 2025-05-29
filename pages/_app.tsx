import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Modal from 'react-modal';
Modal.setAppElement('#__next'); // Or the root div id of your app

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
