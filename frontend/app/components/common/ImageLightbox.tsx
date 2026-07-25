"use client";

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type ImageLightboxSlide = {
    src: string;
    alt: string;
};

type ImageLightboxProps = {
    slides: ImageLightboxSlide[];
    index: number | null;
    onClose: () => void;
};

function ImageLightbox({ slides, index, onClose }: ImageLightboxProps) {
    return (
        <Lightbox
            open={index !== null}
            index={index ?? 0}
            close={onClose}
            slides={slides}
            plugins={[Zoom]}
            zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3 }}
            labels={{
                Close: "Fechar",
                Next: "Próxima",
                Previous: "Anterior",
                "Zoom in": "Ampliar",
                "Zoom out": "Reduzir",
            }}
        />
    );
}

export default ImageLightbox;
