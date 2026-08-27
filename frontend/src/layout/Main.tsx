import Button from "@components/Button";
import Typography from "@components/Typography";

const Main = () => {
  return (
    <div className="bg-light-grey [grid-area:main] grid place-items-center">
      <span className="flex flex-col items-center gap-8">
        <Typography color="medium-grey" variant={"heading-l"}>
          This board is empty. Create a new column to get started.
        </Typography>
        <Button>+ Add New Column</Button>
      </span>
    </div>
  );
};

export default Main;
