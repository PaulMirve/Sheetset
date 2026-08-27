import Button from "@components/Button";
import Icon from "@components/Icon";
import Typography from "@components/Typography";

const Navbar = () => {
  return (
    <div className="bg-white w-full h-24 [grid-area:navbar] border-b border-b-lines flex items-center px-6">
      <Typography variant={"heading-xl"}>Platform Launch</Typography>
      <Button disabled className="ml-auto">
        + Add New Task
      </Button>
      <Icon name="ellipsis-vertical" className="cursor-pointer ml-6" />
    </div>
  );
};

export default Navbar;
