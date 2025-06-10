import { HeroVideoDialog } from '@/components/home/ui/hero-video-dialog';

export function HeroVideoSection() {
  return (
    <div className="relative px-6 mt-10">
      <div className="relative w-full max-w-3xl mx-auto shadow-xl rounded-2xl overflow-hidden">
        <HeroVideoDialog
          className="block dark:hidden"
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/Jnxq0osSg2c?si=k8ddEM8h8lver20s"
          thumbnailSrc="https://image.thum.io/get/width/1920/crop/1080/https://quriosity.com.au"
          thumbnailAlt="Quriosity Website Screenshot"
        />
        <HeroVideoDialog
          className="hidden dark:block"
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/Jnxq0osSg2c?si=k8ddEM8h8lver20s"
          thumbnailSrc="https://image.thum.io/get/width/1920/crop/1080/https://quriosity.com.au"
          thumbnailAlt="Quriosity Website Screenshot"
        />
      </div>
    </div>
  );
}
