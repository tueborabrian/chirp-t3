import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from '~/utils/api';
import { PageLayout } from '~/components/layout';
import { LoadingPage } from '~/components/loading';
import { PostView } from '~/components/post-view';
import { generateSSGHelper } from '~/server/helpers/ssg-helper';

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({ userId: props.userId });

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has not posted</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView { ...fullPost } key={fullPost.post.id} />
      ))}
    </div>
  );
};

const ProfileView: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    username
  });

  if (!data) return <div>404</div>;
  
  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image src={data.profileImageUrl} alt={`${data.username ?? ""}'s profile pic`} width={128} height={128} className="-mb-[64px] rounded-full border-4 border-black absolute bottom-0 left-0 ml-4 bg-black"/>
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
        <div className="border-b w-full forder-slate-400"></div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    }
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
}

export default ProfileView;
