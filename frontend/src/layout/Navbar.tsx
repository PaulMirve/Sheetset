import Typography from "@components/Typography";

const Navbar = () => {
  return (
    <div className="bg-white w-full h-24 [grid-area:navbar] border-b border-b-lines flex items-center px-6">
      <Typography variant={"heading-xl"}>Platform Launch</Typography>
    </div>
  );
};

export default Navbar;
