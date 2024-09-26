import Image, { ImageProps } from "next/image";
import { Typography } from "@/components/foundation";

type HeaderFormProps = ImageProps & {
    title?: string;
    subtitle?: string;
};

const HeaderForm = ({
    src,
    alt,
    title,
    subtitle,
    ...props
}: HeaderFormProps) => {
    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-2">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <Image
                    className="mx-auto h-10 w-auto"
                    src={src}
                    alt={alt}
                    {...props}
                />
                {title && (
                    <Typography
                        element="h2"
                        variant="primary"
                        size="title2"
                        className="mt-10 font-bold text-center tracking-tight"
                        dataTestId="title-form"
                    >
                        {title}
                    </Typography>
                )}
                {subtitle && (
                    <Typography
                        element="h3"
                        variant="secondary"
                        size="title3"
                        className="text-center tracking-tight mt-2"
                        dataTestId="subtitle-form"
                    >
                        {subtitle}
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default HeaderForm;
