import _clsx from "clsx";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import Badge from "../ui/Badge";
import StarRating from '../ui/StarRating'
import Button from "../ui/Button";

const BookHero=({book,onAddToShelf,onShare,_className})=>
{
    const{title,author,cover,globalRating,globalRatingsCount,genre}=book
    const [dropDownOpen,setDropDownOpen]=useState(false)

    return(
        <section>
            <div className='hero-image'>
            {cover?(
                <img src={cover} alt={title} />
            )
            :(<BookOpen size={28}/>)}
            </div>
            <div>
                 {genre && (
            <Badge size="sm" className="hero__genre">
              {genre}
            </Badge>
          )}
          <h1>{title}</h1>
          <p>by {author}</p>
          <StarRating value={globalRating} readOnly/>
          <p>{globalRatingsCount}</p>
            </div>
            <div>
                <Button onClick={()=>onAddToShelf('currently_reading')}
                leftIcon={<BookOpen size='sm'/>}
                size="lg"
                >Start Reading</Button>
                <div>
                    <Button onClick={() => setDropDownOpen(!dropDownOpen)}>Add to Shelf</Button>
                        {dropDownOpen && (
                            <div>
                                <p onClick={() => onAddToShelf('currently_reading')}>Currently Reading</p>
                                <p onClick={() => onAddToShelf('want_to_read')}>Want to Read</p>
                                <p onClick={() => onAddToShelf('finished')}>Finished</p>
                            </div>
                        )}
                    <div>
                        <Button onClick={onShare}>Share</Button>
                    </div>
                </div>
            </div>
        </section>
    )
}