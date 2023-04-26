import { SignInButton, useUser } from '@clerk/nextjs';
import { type NextPage } from "next";
import Image from 'next/image';
import { api } from '~/utils/api';
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from '~/components/loading';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { PageLayout } from '~/components/layout';

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    }
  });

  console.log(user);

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image src={user.profileImageUrl} alt="Profile image" className="w-14 h-14 rounded-full" width={56} height={56} />
      <input placeholder="Type some emojis!" className="grow bg-transparent outline-none" value={input} onChange={(e) => setInput(e.target.value)} />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })} disabled={isPosting}>Post</button>
      )}

      {isPosting && (
        <div className="flex justify-center items-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  )
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="border-b border-slate-400 p-4 flex gap-3">
      <Image src={author.profileImageUrl} alt={`@${author.username} profile image`} className="w-14 h-14 rounded-full" width={56} height={56} />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span><span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <Link href={`/post/${post.id}`}>
          <span className="text-2xl">{post.content}</span>
        </Link>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (<PostView {...fullPost} key={fullPost.post.id} />))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap
  api.posts.getAll.useQuery();

  // Return empty div if BOTH aren't loaded, since the user tends to load faster
  if (!userLoaded) return <div />;

  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
        {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
