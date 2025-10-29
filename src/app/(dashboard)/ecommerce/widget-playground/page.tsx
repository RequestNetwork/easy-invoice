import { PageDescription, PageTitle } from "@/components/page-elements";
import { Playground } from "./_components/playground-form";

export default function WidgetPlaygroundPage() {
  return (
    <>
      <PageTitle>Widget Playground</PageTitle>
      <PageDescription>
        Customize and test the Request Network checkout widget. Copy the code to
        integrate it into your website.
      </PageDescription>
      <Playground />
    </>
  );
}
