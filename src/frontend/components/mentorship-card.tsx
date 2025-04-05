import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Star } from "lucide-react"

interface MentorshipCardProps {
  name: string
  skills: string[]
  rate: string
  rating: number
  image: string
}

export function MentorshipCard({ name, skills, rate, rating, image }: MentorshipCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-40 bg-gradient-to-r from-primary/20 to-primary/10">
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg">{name}</h3>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, index) => (
            <Badge key={index} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Rate</div>
          <div className="font-medium">{rate}</div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button className="flex-1 gap-2">
          <Calendar className="h-4 w-4" />
          Book Session
        </Button>
        <Button variant="outline" className="flex-1">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  )
}

